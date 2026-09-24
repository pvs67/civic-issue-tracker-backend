import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

universities = [
    {"name": "Birla Institute of Technology, Mesra", "expertise_tags": ["urban development", "energy", "environment"]},
    {"name": "National Institute of Technology, Jamshedpur", "expertise_tags": ["urban development", "accessibility", "energy"]},
    {"name": "Ranchi University", "expertise_tags": ["public administration", "rural livelihoods", "education"]},
    {"name": "Central University of Jharkhand", "expertise_tags": ["environment", "agriculture", "rural livelihoods"]},
    {"name": "Vinoba Bhave University", "expertise_tags": ["healthcare", "education", "accessibility"]},
    {"name": "Jharkhand University of Technology", "expertise_tags": ["water resources", "energy", "urban development"]},
    {"name": "Sido Kanhu Murmu University", "expertise_tags": ["agriculture", "rural livelihoods", "public administration"]},
    {"name": "Kolhan University", "expertise_tags": ["healthcare", "water resources", "environment"]},
]

for uni in universities:
    doc_ref = db.collection('universities').document()
    doc_ref.set(uni)
    print(f"Added: {uni['name']}")

print("Done seeding universities.")