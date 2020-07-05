function errHandler() {
  redirectToLogin();
}

function getDateStr(time) {
  var currentdate;
  if (time == -1) currentdate = new Date();
  else currentdate = new Date(time);
  return (
    currentdate.getDate() +
    '/' +
    (currentdate.getMonth() + 1) +
    '/' +
    currentdate.getFullYear() +
    ' ' +
    (currentdate.getHours() < 10 ? '0' : '') +
    currentdate.getHours() +
    ':' +
    (currentdate.getMinutes() < 10 ? '0' : '') +
    currentdate.getMinutes() +
    ':' +
    (currentdate.getSeconds() < 10 ? '0' : '') +
    currentdate.getSeconds()
  );
}

function fetchWaitRoom() {
  makeRequest(
    '/admin/read/waitroom',
    'get',
    {},
    function (wr_data) {
      if (wr_data.error === true && wr_data.errortype === 'auth') {
        redirectToLogin();
        return;
      }

      if (wr_data.success === true) {
        var men = 0;
        var women = 0;
        var unk = 0;
        var wr = '';

        wr_data = wr_data.waitRoom;
        wr_data.sort(function (a, b) {
          if (a.time > b.time) return -1;
          if (a.time < b.time) return 1;
          return 0;
        });

        wr_data.forEach(function (e) {
          var gender;
          if (e.gender === 'FEMALE') {
            gender = 'nữ';
            women++;
          } else if (e.gender === 'MALE') {
            gender = 'nam';
            men++;
          } else {
            gender = 'khác';
            unk++;
          }

          var time = moment(e.time).format('llll');

          wr += `<button class="btn btn-default" onclick="uinfo(${e.id})">
                ${e.id} - ${gender}<br>${time}</button><br>`;
        });

        wr = `<br><b>PHÒNG CHỜ (${wr_data.length} người: ${men} nam, ${women} nữ, ${unk} khác):</b><br>${wr}`;
        $('#ptnkwr').html(wr);
      } else {
        $('#ptnkstats').html('<b>Could not get waitroom: Unknown error</b>');
      }
    },
    errHandler
  );
}

function fetchStats() {
  makeRequest(
    '/admin/read/stats',
    'get',
    {},
    function (stats) {
      if (stats.error === true && stats.errortype === 'auth') {
        redirectToLogin();
        return;
      }

      if (stats.success === true) {
        var text = `<b>CPU: ${stats.cpu} | Memory: ${stats.mem} | Uptime: ${stats.uptime}</b>`;
        $('#ptnkstats').html(text);
      } else {
        $('#ptnkstats').html('<b>Could not get stats: Unknown error</b>');
      }
    },
    errHandler
  );
}

function fetchData() {
  fetchChatRoom();
  fetchWaitRoom();
  fetchStats();
  $('#ptnkheader').html(getDateStr(-1));
}

function uinfo(id) {
  makeRequest(
    '/admin/userinfo',
    'post',
    { id: id },
    function (data) {
      if (data.error === true) {
        if (data.errortype === 'auth') {
          redirectToLogin();
        } else {
          $('#ptnkinfo').html(`<b>ID: ${id}</b><br>Couldn't get info for user ${id}<br>
                              <button class="btn btn-danger" onclick="removeUsr(${id})">End chat</button>`);
        }
        return;
      }

      data = data.userProfile;

      $('#ptnkinfo').html(`<b>ID: ${id}</b><br>${data.name} (<i>${data.gender == 'male' ? 'Nam' : 'Nữ'}</i>)<br>
          <img src="${data.profile_pic}" width="100px"/><br>
          <button class="btn btn-danger" onclick="removeUsr(${id})">End chat</button>`);
    },
    errHandler
  );
}

function removeUsr(id) {
  var cf = confirm('Bạn có chắc muốn Ghéo nối 2 người này?');
  if (cf)
    makeRequest(
      '/admin/edit/chatroom',
      'post',
      { id1: id, id2: id, type: 'match' },
      function (res) {
        if (res.status === true) {
          $('#ptnkinfo').html('Conncet chat for ID ' + id);
          fetchData();
        }
      },
      errHandler
    );
}

!(function ($) {
  $(document).on('click', 'ul.nav li.parent > a > span.icon', function () {
    $(this).find('em:first').toggleClass('glyphicon-minus');
  });
  $('.sidebar span.icon').find('em:first').addClass('glyphicon-plus');
})(window.jQuery);

$(window).on('resize', function () {
  if ($(window).width() > 768) $('#sidebar-collapse').collapse('show');
});
$(window).on('resize', function () {
  if ($(window).width() <= 767) $('#sidebar-collapse').collapse('hide');
});

moment.locale('vi');
fetchData();
setInterval(fetchData, 5000);
