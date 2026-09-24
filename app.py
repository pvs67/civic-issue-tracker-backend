import os
import time
import math
from datetime import datetime, timezone
from collections import Counter
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template
import firebase_admin
from firebase_admin import credentials, firestore
from google import genai
import json
import cloudinary
import cloudinary.uploader

load_dotenv()

# Firebase setup
if os.path.exists("serviceAccountKey.json"):
    cred = credentials.Certificate("serviceAccountKey.json")
else:
    firebase_key_json = os.getenv("FIREBASE_SERVICE_ACCOUNT")
    cred = credentials.Certificate(json.loads(firebase_key_json))
firebase_admin.initialize_app(cred)
db = firestore.client()

# Gemini setup
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL = "gemini-flash-lite-latest"  # 500 RPD free tier vs 20 RPD on gemini-flash-latest

# Cloudinary setup
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

app = Flask(__name__)


def call_gemini_with_retry(prompt, max_retries=3):
    """Calls Gemini, retrying on transient errors. Fails fast on quota exhaustion."""
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
            return response
        except Exception as e:
            error_str = str(e)
            if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
                raise Exception("QUOTA_EXCEEDED")
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            else:
                raise e


def find_matching_university(category):
    universities_ref = db.collection('universities')
    query = universities_ref.where('expertise_tags', 'array_contains', category).limit(1)
    results = query.stream()
    for doc in results:
        return {"id": doc.id, "name": doc.to_dict()['name']}
    return None


def haversine_distance(lat1, lng1, lat2, lng2):
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def check_duplicate(category, lat, lng, radius_meters=500):
    if lat is None or lng is None:
        return None
    recent = db.collection('submissions') \
        .where('category', '==', category) \
        .limit(50) \
        .stream()
    for doc in recent:
        d = doc.to_dict()
        existing_lat = d.get('lat')
        existing_lng = d.get('lng')
        if existing_lat is None or existing_lng is None:
            continue
        dist = haversine_distance(lat, lng, existing_lat, existing_lng)
        if dist <= radius_meters:
            return {"id": doc.id, "distance_m": round(dist, 1)}
    return None


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/dashboard')
def dashboard_page():
    return render_template('dashboard.html')


@app.route('/submit-report', methods=['POST'])
def submit_report():
    try:
        description = request.form.get('description')
        district = request.form.get('district')
        lat = request.form.get('lat')
        lng = request.form.get('lng')
        lat = float(lat) if lat else None
        lng = float(lng) if lng else None

        image_url = None
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file.filename != '':
                upload_result = cloudinary.uploader.upload(image_file)
                image_url = upload_result.get('secure_url')

        doc_ref = db.collection('submissions').document()
        doc_ref.set({
            'text': description,
            'district': district,
            'lat': lat,
            'lng': lng,
            'image_url': image_url,
            'status': 'Pending',
            'category': None,
            'summary': None,
            'priority': None,
            'created_at': datetime.now(timezone.utc)
        })

        prompt = f"""
        Analyze this civic issue report and respond ONLY with valid JSON, no markdown, no extra text:
        {{
          "category": "one of: education, agriculture, healthcare, water resources, environment, energy, urban development, accessibility, public administration, rural livelihoods",
          "summary": "one sentence summary of the issue",
          "priority": "one of: Low, Medium, High, Critical"
        }}

        Priority guidance: Critical = immediate safety/health risk to many people. High = significant disruption or risk, needs quick attention. Medium = real problem, not urgent. Low = minor inconvenience.

        Report: {description}
        """

        response = call_gemini_with_retry(prompt)
        cleaned = response.text.replace("```json", "").replace("```", "").strip()
        result = json.loads(cleaned)

        duplicate = check_duplicate(result['category'], lat, lng)
        matched_university = find_matching_university(result['category'])

        doc_ref.update({
            'category': result['category'],
            'summary': result['summary'],
            'priority': result['priority'],
            'university_id': matched_university['id'] if matched_university else None,
            'university_name': matched_university['name'] if matched_university else None,
            'possible_duplicate_of': duplicate['id'] if duplicate else None,
            'status': 'Possible Duplicate' if duplicate else 'Pending'
        })

        return jsonify({
            "status": "success",
            "id": doc_ref.id,
            "category": result['category'],
            "priority": result['priority'],
            "university": matched_university['name'] if matched_university else "No match found",
            "duplicate_warning": f"Possible duplicate of report {duplicate['id']} ({duplicate['distance_m']}m away)" if duplicate else None,
            "image_url": image_url
        })

    except Exception as e:
        error_str = str(e)
        print("ERROR in submit_report:", error_str)
        if "QUOTA_EXCEEDED" in error_str:
            return jsonify({
                "status": "error",
                "message": "AI service daily limit reached. This resets at midnight Pacific time."
            }), 429
        return jsonify({
            "status": "error",
            "message": "Something went wrong processing your report. Please try again."
        }), 500

@app.route('/university')
def university_page():
    return render_template('university.html')


@app.route('/university-data/<university_name>')
def university_data(university_name):
    try:
        submissions = db.collection('submissions') \
            .where('university_name', '==', university_name) \
            .stream()

        results = []
        for doc in submissions:
            d = doc.to_dict()
            results.append({
                "id": doc.id,
                "text": d.get('text'),
                "category": d.get('category'),
                "priority": d.get('priority'),
                "district": d.get('district'),
                "status": d.get('status'),
                "image_url": d.get('image_url')
            })
        return jsonify(results)
    except Exception as e:
        print("ERROR in university_data:", str(e))
        return jsonify({"status": "error", "message": "Could not load data"}), 500


@app.route('/update-status', methods=['POST'])
def update_status():
    try:
        data = request.json
        doc_id = data.get('id')
        new_status = data.get('status')

        db.collection('submissions').document(doc_id).update({'status': new_status})
        return jsonify({"status": "success"})
    except Exception as e:
        print("ERROR in update_status:", str(e))
        return jsonify({"status": "error", "message": "Could not update status"}), 500


@app.route('/dashboard-data')
def dashboard_data():
    try:
        submissions = db.collection('submissions').stream()

        category_counts = Counter()
        district_counts = Counter()
        status_counts = Counter()
        total = 0

        for doc in submissions:
            d = doc.to_dict()
            total += 1
            if d.get('category'):
                category_counts[d['category']] += 1
            if d.get('district'):
                district_counts[d['district']] += 1
            if d.get('status'):
                status_counts[d['status']] += 1

        return jsonify({
            "total": total,
            "by_category": dict(category_counts),
            "by_district": dict(district_counts),
            "by_status": dict(status_counts)
        })
    except Exception as e:
        print("ERROR in dashboard_data:", str(e))
        return jsonify({"status": "error", "message": "Could not load dashboard data"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000, threaded=True)