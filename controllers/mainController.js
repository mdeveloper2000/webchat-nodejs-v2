const rooms = [
    { name: "VueJS" },
    { name: "NuxtJS" },
    { name: "Vuetify" },
    { name: "ReactJS" },
    { name: "AngularJS" },
    { name: "NodeJS" },
    { name: "Java" },
    { name: "PHP" },
    { name: "MySQL" },
    { name: "Bootstrap" },
    { name: "Unity" },
    { name: "PhaserJS" }
]

const index_action = (req, res) => {    
    res.render('index', { title: 'Index', suggestions: rooms })
}

const room_enter = (req, res) => {
    const selected = req.params.name
    let exists = false
    rooms.map(room => {
        if(room.name === selected) {
            exists = true            
        }
    })
    if(exists) {
        res.render("room", { title: selected })
    }
    else {
        res.render("404", { title: "Erro 404" })
    }
}

const error_404 = (req, res) => {
    res.render("404", { title: "Página não encontrada" })
}

module.exports = {
    index_action,
    room_enter,
    error_404
}