const socket = io()

//elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationFromButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $locationMsg = document.querySelector('#locationMsg')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML

const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username, room }= Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll =()=>{
    //new message elemt

    const $newMessage = $messages.lastElementChild

    //heignt of new message
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMesasHeight = $newMessage.offsetHeight+newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight  = $messages.scrollHeight


    //how far have i scrolled
    const scorlloffset = $messages.scrollTop+visibleHeight

    if(containerHeight-newMesasHeight<=scorlloffset){
        $messages.scrollTop = $messages.scrollHeight
    }


}


socket.on('greetNewConnection',(greet)=>{
    const html = Mustache.render(messageTemplate,{
        username:greet.username,
        message:greet.text,
        createdAt:moment(greet.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()


})

socket.on('locationMessage',(message)=>{
    const html = Mustache.render(locationTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $locationMsg.insertAdjacentHTML('beforeend',html)
    autoscroll()

    

})

socket.on('roomData',({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users

    })
    document.querySelector('#sidebar').innerHTML = html
})



$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    //disabled the button
    $messageFormButton.setAttribute('disabled','disabled')
    const message =e.target.elements.message.value
    socket.emit('sendMessage',message, (error)=>{
        //enabled
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }
    }) 
})


$locationFromButton.addEventListener('click',()=>{
    //disabled location button
    $locationFromButton.setAttribute('disabled','disabled')
    if(!navigator.geolocation){
        return alert('geolocation is not supported by your browser')
    }

  

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },(error)=>{
            if(error){
                return console.log(error)
            }
            //remove location form button disabled feature
            $locationFromButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join',{
    username,
    room
},(error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})

