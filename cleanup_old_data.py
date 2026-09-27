import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

docs = db.collection('submissions').stream()
count = 0
for doc in docs:
    db.collection('submissions').document(doc.id).delete()
    count += 1

print(f"Deleted {count} submissions.")