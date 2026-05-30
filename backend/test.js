fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        email: "test@gmail.com",     // Jo email pehle banaya tha wahi daalein
        password: "mypassword123"   // Sahi password
    })
})
    .then(res => res.json())
    .then(data => console.log("Response:", data))
    .catch(err => console.log("Error:", err));

