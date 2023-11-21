const express = require('express')
const mainController = require('../controllers/mainController')

const router = express.Router()

router.get("/", mainController.index_action)
router.get("/room/:name", mainController.room_enter)

module.exports = {
    router
}