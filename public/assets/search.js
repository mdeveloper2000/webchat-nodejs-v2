const socket = io()

function openModal() {
    const modal = new bootstrap.Modal(document.querySelector("#searchModal"))
    modal.show()
}

function search() {
    const search = document.querySelector("#nicknameSearch")
    if(search.value.trim().length < 3) {
        const message = document.querySelector(".message")
        message.innerHTML = "A pesquisa deve conter pelo menos 3 caracteres"
        document.querySelector(".alert").style.display = "block"
    }
    else {
        socket.emit("search-nickname", search.value)
    }    
}

socket.on("search-result", (users) => {
    const search_results = document.querySelector('.search_results')
    if(users.length === 0) {
        search_results.innerHTML = ""
        const message = document.querySelector(".message")
        message.innerHTML = "A pesquisa não retornou nenhum resultado"
        document.querySelector(".alert").style.display = "block"
    }
    else {
        document.querySelector(".alert").style.display = "none"        
        search_results.innerHTML = ""
        users.forEach(user => {
            const div_card = document.createElement("div")
            div_card.style.display = "inline-block"
            div_card.style.width = "10rem"
            const a = document.createElement("a")
            a.style.textDecoration = "none"
            a.href = `/room/${user.room}`            
            div_card.classList.add("card", "border", "shadow", "p-1", "mt-3", "ms-1", "text-center")            
            const div_body = document.createElement("div")
            div_body.classList.add("card-body")            
            const div_title = document.createElement("div")
            div_title.innerHTML = `<span class="p-1">${user.nickname}</span>`
            const div_text = document.createElement("div")
            div_text.classList.add("card-text")
            div_text.innerHTML = `<p class="text-bg-primary border mt-3 p-2 rounded">${user.room}</p>`
            div_body.appendChild(div_title)
            div_body.appendChild(div_text)
            div_card.appendChild(div_body)
            a.appendChild(div_card)
            search_results.appendChild(a)
        })        
    }
})