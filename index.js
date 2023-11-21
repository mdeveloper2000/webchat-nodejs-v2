const express = require('express')
const path = require('path')
const multer = require("multer")
const http = require("http")
const socketIO = require("socket.io")
const { router } = require('./routes/routes')

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

const PORT = 3000

app.use(express.static('public'))
app.use('/css', express.static(path.join(__dirname, "node_modules/bootstrap/dist/css")))
app.use('/font', express.static(path.join(__dirname, "node_modules/bootstrap-icons/font")))
app.use('/js', express.static(path.join(__dirname, "node_modules/bootstrap/dist/js")))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(router)

app.set('view engine', 'ejs')

server.listen(PORT || 5000, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})

const rooms = [
    { name: "VueJS", users: [] },
    { name: "NuxtJS", users: [] },
    { name: "Vuetify", users: [] },
    { name: "ReactJS", users: [] },
    { name: "AngularJS", users: [] },
    { name: "NodeJS", users: [] },
    { name: "Java", users: [] },
    { name: "PHP", users: [] },
    { name: "MySQL", users: [] },
    { name: "Bootstrap", users: [] },
    { name: "Unity", users: [] },
    { name: "PhaserJS", users: [] }
]

const images = ["image/jpg", "image/jpeg", "image/png"]

const storageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads")
    },
    filename: (req, file, cb) => {        
        if(!images.includes(file.mimetype)) {
            return cb(new Error("Formato de imagem precisa ser do tipo JPG ou PNG"))
        }
        cb(null, `${Date.now()}--${file.originalname}`)
    },
})

const upload = multer({
    storage: storageEngine,
    limits: { fileSize: 1000000 }
})

app.post("/upload", upload.single("picture"), (req, res, next) => {
    try {        
        if(req.file) {            
            res.status(200).send({
                urlfile: req.file.filename
            })
        }
    }
    catch(err) {
        console.log(err)
    }
})

const maxUsers = 20

io.on("connection", (socket) => {
    
    socket.on("join-request", (user) => {        
        let nicknameTaken = false
        const room = rooms.filter(element => element.name === user.room)        
        room[0].users.forEach(chatUser => {            
            if(chatUser.nickname.toUpperCase() === user.nickname.toUpperCase()) {
                nicknameTaken = true
                return
            }
        })
        if(!nicknameTaken) {
            if(room[0].users.length > (maxUsers - 1)) {
                socket.emit("user-notok", `A sala ${user.room} está lotada`)
                return
            }            
            let newUser = {
                id: socket.id,
                nickname: user.nickname
            }
            room[0].users.push(newUser)
            socket.nickname = user.nickname
            socket.room = user.room
            socket.emit("user-ok", room[0], newUser)           
            socket.broadcast.emit("list-update", {
                status: "joined",
                user: newUser,
                list: room[0]
            })            
        }
        else {
            socket.emit("user-notok", `Esse apelido já está sendo utilizado na sala ${user.room}`)
        }
    })

    socket.on("disconnect", () => {        
        const room = rooms.filter(element => element.name === socket.room)
        if(room.length > 0) {            
            room[0].users = room[0].users.filter(user => user.nickname !== socket.nickname)        
            const newUser = {
                id: socket.id,
                nickname: socket.nickname
            }                 
            socket.broadcast.emit("list-update", {
                status: "left",
                user: newUser,
                list: room[0]
            })
        }
    })

    socket.on("send-msg", (txt, idSelect, image) => {
        let obj = {
            id: socket.id,
            room: socket.room,
            nickname: socket.nickname,
            message: txt,
            img: image,
            private: false
        }
        if(idSelect !== null && image === null) {
            obj.message = "(reservadamente) " + obj.message
            obj.private = true
        }
        if(idSelect !== null) {
            socket.to(idSelect).emit("show-msg", obj)
            io.to(socket.id).emit("show-msg", obj)
        }
        else {
            socket.emit("show-msg", obj)
            socket.broadcast.emit("show-msg", obj)
        }
    })

    socket.on("search-nickname", (search) => {
        let users = []        
        if(search.length > 2) {            
            rooms.forEach(room => {                
                if(room.users.length > 0) {
                    room.users.forEach(user => {
                        if(user.nickname.toUpperCase().includes(search.toUpperCase())) {
                            const newUser = { room: room.name, nickname: user.nickname }
                            users.push(newUser)                            
                        }
                    })
                }
            })
        }
        socket.emit("search-result", users)
    })

})