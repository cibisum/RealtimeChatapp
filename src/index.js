const express= require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')



const {generateMessage,generatedLocationMessage}=require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

//setting static path
const staticPath = path.join(__dirname,'../public/')

//serving public directory
app.use(express.static(path.join(staticPath)))



io.on('connection',(socket)=>{
    console.log('new connection')
    socket.on('join',(options,callback)=>{
       const {error,user} = addUser({
            id:socket.id,
            ...options
        })
        if(error){
            return callback(error)
        }


        socket.join(user.room)
        socket.emit('greetNewConnection',generateMessage('Admin','Welcome'))
        socket.broadcast.to(user.room).emit('greetNewConnection',generateMessage('Admin',`${user.username} has joined`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })

        callback()

    })





    socket.on('sendMessage',(msg,callback)=>{
        const user= getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(msg)){
            return callback('Profinity is not allowed')
        }
        io.to(user.room).emit('greetNewConnection',generateMessage(user.username,msg))
        callback()
    })

    socket.on('disconnect',()=>{
        const user =  removeUser(socket.id)
        if(user){
            io.to(user.room).emit('greetNewConnection',generateMessage('Admin',`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
        
    })

    socket.on('sendLocation',(cords,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generatedLocationMessage(user.username,`https://google.com/maps?q=${cords.latitude},${cords.longitude}`))
        callback()
    })
})


server.listen(port,()=>{
    console.log(`Server running at port ${port}`)
})

