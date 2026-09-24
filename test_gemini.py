import os
from dotenv import load_dotenv
from google import genai
import json

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

sample_problem = "There's a huge pothole on the main road near my house, it's been there for 2 weeks and causing accidents. Also water is leaking from a broken pipe nearby."

prompt = f"""
Analyze this civic issue report and respond ONLY with valid JSON, no markdown, no extra text:
{{
  "category": "one of: infrastructure, water, sanitation, electricity, safety, other",
  "summary": "one sentence summary of the issue"
}}

Report: {sample_problem}
"""

response = client.models.generate_content(
    model="gemini-flash-latest",
    contents=prompt
)
print("Raw response:", response.text)

cleaned = response.text.replace("```json", "").replace("```", "").strip()
parsed = json.loads(cleaned)
print("Parsed JSON:", parsed)