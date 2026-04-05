import requests

url = "http://localhost:8080/api/send"
headers = {
    "Authorization": "Bearer ot_3ce802afb4a7374d2383b9b248b9fd775e96bb31",
    "Content-Type": "application/json"
}
data = {
    "phone": "9647766898208",
    "name": "Ahmad",
    "code": "555666"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())