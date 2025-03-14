curl -X POST http://localhost:7628/api/userClientMappings \
  -H "Content-Type: application/json" \
  -d '{
        "userId": "be05c0cc-3f0b-4338-9557-a21b64abe4cb",
        "targetClientId": "ep6"
      }'
