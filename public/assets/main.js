const socket = io()

let userList = []
let idSelected = null

let loginBtn = document.querySelector("#loginBtn")
let messageInput = document.querySelector("#messageInput")
let namesList = document.querySelector(".userList")
let fileSend = document.querySelector("#fileSend")
let toast = document.querySelector("#liveToast")

loginBtn.addEventListener("click", () => {    
    const nickInput = document.querySelector("#nickInput")
    if(nickInput.value.trim() !== "" && nickInput.value.trim().length > 2) {
        const user = {
            nickname: nickInput.value.trim(),
            room: document.querySelector("#room").value
        }
        socket.emit("join-request", user)
    }
    else {
        const message = document.querySelector("#message")
        const alert = document.querySelector(".alert")
        message.textContent = "O apelido deve conter pelo menos 3 caracteres"
        alert.style.display = "block"        
        nickInput.focus()
    }
})

fileSend.addEventListener("click", () => {
    if(idSelected === null) {
        let msg = document.querySelector(".toast-body")
        msg.innerHTML = "Selecione alguém antes de enviar a imagem"
        var toastElList = [].slice.call(document.querySelectorAll(".toast"))
        var toastList = toastElList.map(function(toastEl) {
            return new bootstrap.Toast(toastEl)
        })
        toastList.forEach(toast => toast.show())
    }
    else {
        let formData = new FormData();
        let picture = document.querySelector("#picture")
        formData.append("picture", picture.files[0])
        fetch("/upload", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(response => {
            socket.emit("send-msg", response.urlfile, idSelected, "img")
        })
    }
})

namesList.addEventListener("click", (e) => {
    idSelected = e.target.id    
    let selecionado = e.target.getAttribute("data-user") 
    if(idSelected === document.querySelector("#userID").value) {
        let listItems = document.querySelectorAll(".userList li")
        for(let i = 0; i < listItems.length; i++) {
            listItems[i].classList.remove("border-light", "text-bg-success")
            listItems[i].classList.add("text-bg-success")
        }
        idSelected = null
        messageInput.placeholder = "Digite sua mensagem e pressione ENTER (a mensagem será enviada para toda a sala)"
        return
    }
    else {
        let listItems = document.querySelectorAll(".userList li")
        for(let i = 0; i < listItems.length; i++) {
            listItems[i].classList.remove("text-bg-success", "border-light")
        }
        e.target.classList.add("text-bg-success", "border-light")
        messageInput.placeholder = `Digite a mensagem reservada para ( ${selecionado.trim()} ) e pressione ENTER`
        messageInput.focus()
    }
})

messageInput.addEventListener("keyup", (e) => {
    if(e.keyCode === 13) {
        let txt = messageInput.value.trim()
        messageInput.value = ""
        if(txt != "") {
            socket.emit("send-msg", txt, idSelected, null)
            messageInput.focus()
        }
    }
})

function addMessage(type, user, msg, private) {    
    let ul = document.querySelector(".chatList")
    switch(type) {
        case "status":
            ul.innerHTML += `<li class="list-group-item bg-success text-white fw-bold fst-italic mt-1">${msg}</li>`
        break
        case "exit":
            ul.innerHTML += `<li class="list-group-item bg-danger text-white fw-bold fst-italic mt-1">${msg}</li>`
        break        
        case "msg":
            if(private) {
                ul.innerHTML += `<li class="list-group-item text-bg-primary mt-1 mb-1"><b>${user}:</b> ${msg}</li>`
            }
            else {
                ul.innerHTML += `<li class="list-group-item text-bg-warning mt-1 mb-1"><b>${user}:</b> ${msg}</li>`            
            }            
        break
        case "img":
            ul.innerHTML += `<li class="list-group-item bg-warning text-dark fw-bold mt-1 mb-1">
                                <b>${user}: </b>(reservadamente)<br /><img src="http://localhost:3000/uploads/${msg}" class="img-fluid" />
                            </li>`            
        break
    }
    setTimeout(() => {
        ul.scrollTop = ul.scrollHeight
    }, 500)
}

function renderUserList(newUser) {
    let ul = document.querySelector(".userList")
    ul.innerHTML = ""
    document.querySelector("#numbers").innerHTML = userList.users.length
    userList.users.forEach(user => {
        const li = document.createElement("li")        
        if(user.id == document.querySelector("#userID").value) {
            li.innerHTML = `<li class="list-group-item fw-bold text-bg-primary" id="${user.id}" data-user="${user.nickname}">
                                <i class="bi bi-person-circle"></i> ${user.nickname}
                            </li>`
            ul.prepend(li)
        }
        else {
            li.innerHTML = `<li class="list-group-item fw-bold text-bg-primary" id="${user.id}" data-user="${user.nickname}">
                                <i class="bi bi-person-fill"></i> ${user.nickname}
                            </li>`
            ul.appendChild(li)
        }
    })
}

socket.on("user-ok", (list, newUser) => {
    userList = list    
    let dismiss = document.getElementById("dismiss")
    dismiss.click()    
    document.querySelector("#userID").value = newUser.id
    addMessage("status", null, "Você se conectou ao chat...", null)
    messageInput.disabled = false
    messageInput.focus()
    renderUserList(newUser)
})

socket.on("user-notok", (msg) => {
    let message = document.querySelector("#message")
    let alert = document.querySelector(".alert")
    message.textContent = msg
    alert.style.display = "block"
})

socket.on("list-update", (data) => {    
    if(data.list.name === document.querySelector("#room").value) {
        if(data.status === "joined") {
            addMessage("status", null, data.user.nickname + " entrou no chat...", false)
        }
        if(data.status === "left") {
            addMessage("exit", null, data.user.nickname + " saiu no chat...", false)
        }
        userList = data.list
        renderUserList(data.user)        
    }    
})

socket.on("show-msg", (data) => {
    if(data.room === document.querySelector("#room").value) {
        if(data.img === null) {
            addMessage("msg", data.nickname, data.message, data.private)
        }
        else {
            addMessage("img", data.nickname, data.message, data.private)
        }
    }    
})

socket.on("disconnect", () => {
    addMessage("exit", null, "Você está desconectado do chat")
    userList = []
    renderUserList()
})