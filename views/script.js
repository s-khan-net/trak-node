var map;
var markers = [];
var toastMessages = [];
var pics = 35;
var socket;
var watchId = null;
$(document).ready(function () {
    // $('.alert').alert('close');
    socket = io('https://trak-8j4p.onrender.com/');
    socket.on('connect', function () {
        console.log('connected')
    });
    showMap();
    socket.on('updated', setUpdated)
    socket.on('remove', removeUser)
    socket.on('added', userAdded)
    socket.on('joined', ivejoined)
    $('#userModal').on('shown.bs.modal', function () {
        var html = '';
        for (let i = 1; i <= pics; i++) {
            html += `<div style="display:inline-flex;flex: none;margin-left: 5px;" id="selectAvatar" onclick="$('#userAvatar > img').prop('src','./images/avatars/${i}.png');$('#modalAvatars').modal('hide');" style="text-align:center;margin-bottom:2px;cursor:pointer"><img style="border: 3px solid silver;border-radius: 4px;"src="./images/avatars/${i}.png" /></div>`;
        }
        html += '';
        $('#avatars').html(html);
    });
    $('#txtUserName').on('keyup', function () {
        if ($('#txtUserName').val().length > 3) {
            $('#txtUserName').attr('style', 'border:none');
            $('#btnStart').removeAttr('disabled');
        }
        else {
            $('#txtUserName').attr('style', 'border:1px solid red');
            $('#btnStart').attr('disabled', 'disabled');
        }
        if ($('#txtUserName').val().length == 12) {
            $('#txtUserName').val($('#txtUserName').val().substring(0, $('#txtUserName').val().length - 1));
        }
    });
    $('#chkShare').change((e) => {
        if ($('#chkShare').prop('checked')) {
            $('#chkShare').removeClass('error-border')
            $('#btnStart').removeAttr('disabled');
        }
        else {
            $('#chkShare').addClass('error-border')
            $('#btnStart').attr('disabled', 'disabled');
        }
    })
    $('#btnStart').click(() => {
        addUser();
        hideUserModal();
    })
    $('#userList > #header').click(() => {
        if ($('#userList').css('margin-left').indexOf('-') == -1) {
            $('#userList').animate({ 'marginLeft': '-226px' }, 500);
        }
        else {
            $('#userList').animate({ 'marginLeft': '0px' }, 500);
        }
    })
});

function ivejoined(e) {
    if (e) {
        e.forEach(element => {
            showPosition(element.startPosition, element.user)
        });
    }
}

function userAdded(e) {
    toastMessages.push(`${e.userName} has connected....`);
    showToast();
}

function setUpdated(e) {
    console.log(e);
    showPosition(e.position, e.user);
}
function updateUserList() {
    let html = '';
    for (let i = 0; i < markers.length; i++) {
        html += `<div onclick="flytoUser(${i})" style="display:flex;cursor:pointer"><div style="flex:3;text-align:center">${markers[i].options.user.userName}</div><div style="flex:1;text-align:center"><img src="images/avatars/${markers[i].options.user.userPic}" style="width:32px" /></div></div>`
    }
    $('#userListusers').html(html);
    if (Number(window.innerWidth - 60) <= 400) {
        $('#userList').animate({ 'marginLeft': '-226px' }, 500);
    }
    //add the slimscroll
    if (Number(window.innerHeight - 60) <= $('#userList').height()) {
        $('#userList').slimScroll({
            height: window.innerHeight - 84,
            position: 'left'
        });
    }
}
function flytoUser(i) {
    marker = markers[i]
    if (map) {
        let coords = marker.getLatLng();
        map.flyTo({ lat: coords.lat, lng: coords.lng }, 16)
    }
}
function removeUser(e) {
    let delMarker = markers.filter(m => {
        return m.options.user.userId == e.user.userId
    })[0];
    delMarker.remove();
    markers.splice(markers.findIndex(m => { return m.options.user.userId == e.user.userId }), 1);
    updateUserList();
    toastMessages.push(`<img src="images/avatars/${e.user.userPic}" /><strong class="me-auto" style="margin-left: 12px;">${e.user.userName}</strong>&nbsp;&nbsp;&nbsp;  has disconnected`);
    showToast();
}
function showMap() {
    map = L.map('map', { zoomControl: false, zoom: 4, center: [22.6268444, 81.1496509], });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
}
function showPosition(position, user) {
    let locMarker = markers.filter(m => {
        return m.options.user.userId == user.userId
    })[0]

    //define options
    if (!locMarker) {
        let iconOptions = {
            title: user.userName,
            riseOnHover: true,
            user: user
        }
        locMarker = new L.Marker([position.coords.latitude, position.coords.longitude], iconOptions);
        locMarker.addTo(map);
        locMarker.bindPopup(`<img src="images/avatars/${user.userPic}" style="width: 32px;" /><span class="me-auto" style="margin-left: 12px;">${user.userName}</span>`)
        markers.push(locMarker)
        updateUserList();
    }
    else {
        var newLatLng = new L.LatLng(position.coords.latitude, position.coords.longitude);
        locMarker.setLatLng(newLatLng);
    }

}
function showUserModal(user) {
    if ($('#userAvatarNavbar').html().indexOf('img') == -1) {
        $('#userModal').modal('show')
    }
    else {
        const nme = $('#userAvatarNavbar').html().split('<img')[0]
        const img = $('#userAvatarNavbar').html().split('<img')[1]
        let html = `<img ${img}<strong class="me-auto" style="margin-left: 12px;">${nme}</strong>
                <small>trakked...</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>`;
        $('#loginToastHeader').html(html);
        const loginToast = $('#loginToast');
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(loginToast);
        toastBootstrap.show();
    }

}
function hideUserModal() {
    $('#userModal').modal('hide')
}
function showToast(msg) {
    const userConnectToast = $('#userConnectToast');
    if (toastMessages.length > 0) {
        let toastInterval = setInterval(() => {
            userConnectToast.children().children()[0].innerHTML = toastMessages[0];
            toastMessages.shift();//REMOVE 1ST ITEM
            const toastBootstrap = bootstrap.Toast.getOrCreateInstance(userConnectToast);
            toastBootstrap.show();
            if (toastMessages.length == 0) clearInterval(toastInterval)
        }, 2000);

    }
}

function onMapClick(e) {
    //
}

/**unused */
function loginas(val) {
    // if (navigator.geolocation) {
    //     navigator.geolocation.getCurrentPosition(showPosition, (ero) => { console.log(ero) });

    // }
    let user = users.filter(u => {
        return u.userName == val
    })[0]
    let count = 0;

    setInterval(() => {
        if (paths[val].length <= count) count = 0;
        position = {
            coords: {
                latitude: Number(paths[val][count].split(',')[0]),
                longitude: Number(paths[val][count].split(',')[1]),
            }
        }
        socket.emit('updateLocation', { user: user, position: position });
        count = count + 1;
    }, 3000);



}
function addUser() {
    if (navigator.geolocation) {
        let user = {
            userName: $('#txtUserName').val(),
            userId: markers.length + Math.random().toString(),
            userPic: $('#userAvatar > img').prop('src').split('/').pop()
        }
        // start watching for position changes
        watchId = window.navigator.geolocation.watchPosition((position) => {
            socket.emit('updateLocation', { user: user, position: position });
        }, (ero) => { console.error(ero) });

        // navigator.geolocation.getCurrentPosition((position) => {
        //     socket.emit('updateLocation', { user: user, position: position });
        // }, (ero) => { console.error(ero) });
        updateUserAvatarNavbarr(user);
    }
    else {
        alert('Update you browser!!!')
    }
}

function updateUserAvatarNavbarr(user) {
    $('#userAvatarNavbar').html(`${user.userName} <img src="images/avatars/${user.userPic}" style="width:32px;margin-left: 12px;" alt="${user.userName}" />`)
}