fetch('http://localhost:3000').then(r=>r.text()).then(t=>console.log(t.substring(0, 1000)));
