// Костыли с интервалом и путём из-за того, что при переходах между страницами, скрипт не подхватывается.
let path = window.location.pathname;
let loading = false;

window.onload = () => {
    const $ = require('jquery');

    setInterval(() => {
        console.log(path,  window.location.pathname);
        if (path !== window.location.pathname) {
            setHover();
        }
    }, 3000);

    setInterval(function() {
        if ($('.content-info--full').length !== 0) {
            if ($('.bookmarks_return').length == 0) {
                var parse = $('.entry_data').attr("data-article-info");
                parse = JSON.parse(parse);
                $('.bookmark--type-content').append('<div class="v-repost__counter bookmarks_return">' + parse.favorites + '</div>');
            }
        }
    }, 1000);

    $(document).ready(function(){
        var activeSide = '';
        var refreshIntervalId = setInterval(function() {
          if(window.location.href.indexOf("/u/") == -1) {
            if(window.location.href.indexOf("/popular") != -1 || window.location.href.indexOf("/all") != -1
            || window.location.href.indexOf("/new") != -1) {
              var tabs = `
                <div class="pass-dropdown">
                  <span id="pass-splitter">Все посты</span>
                  <div id="tabs" class="pass-dropdown-content">
                    <a id="tab1">Все посты</a>
                    <a id="tab2">Блог</a>
                    <a id="tab3">Подсайты</a>
                  </div>
                </div>
                <div class="tab-box" id="tab1C"></div>
                <div class="tab-box" id="tab2C"></div>
                <div class="tab-box" id="tab3C"></div>
              `;
              if ($('#tabs').length == 0) {
                $('.ui-filters').css('float', 'left');
                $(tabs).insertAfter( $( ".ui-filters" ) );
                $('#tabs li a:not(:first)').addClass('inactive');
                $('.tab-box').hide();
                $('.tab-box:first').show();
                    
                $('#tabs a').click(function(){
                  $('#pass-splitter').text($(this).text());
                  $(".content-feed").removeClass("moved");
                  var t = $(this).attr('id');
                  activeSide = t;
                  if($(this).hasClass('inactive')){ //this is the start of our condition 
                      $('#tabs a').addClass('inactive');           
                      $(this).removeClass('inactive');
                      
                      $('.tab-box').hide();
                      $('#'+ t + 'C').fadeIn('slow');
                  }
                });
              }
              
              setInterval(function() {
                if (activeSide == 'tab1' || activeSide == 'tab2' ||activeSide == 'tab3') {
                  $(".content-feed").each(function() {
                    if (!$(this).hasClass("moved")) {
                      $(this).addClass("moved");
                      if ($(this).hasClass("content-feed--unknown")) {
                        if (activeSide == 'tab1' || activeSide == 'tab2') {
                          $(this).css('display', 'block');
                        } else {
                          $(this).css('display', 'none');
                        }
                      } else {
                        if (activeSide == 'tab1' || activeSide == 'tab3') {
                          $(this).css('display', 'block');
                        } else {
                          $(this).css('display', 'none');
                        }
                      }
                    }
                  });
                }
              }, 1000);
      
            }
          }
        }, 1000);
    });
}

const userIdRx  = /\/u\/([0-9]*)/;

function setHover() {
    const $ = require('jquery');
    path = window.location.pathname;
    $( ".comment__author" ).hover(
        function() {
            const data = this;
                setTimeout(async function() {
                    if (!loading) {
                        const url = $(data).attr('href');
                        const id = userIdRx.exec(url);
                        await loadProfileViaAPI(id[1], data);
                    }
                }, 1000);
        }, function() {
            $('#account_info').remove();
            loading = false;
        }
    );
}

async function loadProfileViaAPI(id, comment) {
    const $ = require('jquery');
    loading = true;

    // я не смог вытащить этих данных из текущей страницы
    // поэтому пока единственным решением вижу её скачать вручную и спарсить
    const profile = await fetch(`https://api.dtf.ru/v1.9/user/${id}`);
    if (profile.status !== 200)
        return;

    const rawData = await profile.json();

    // может быть 403 ошибка, если, к примеру, администрация скрыла профиль
    // профиль того же Олегоси не получить через api
    if (rawData.error) {
        console.error('cant load profile info: ', rawData.message);

        return;
    }

    const json = rawData.result;

    if (!json || !json.counters)
        return;

    let headerImage = "https://cs11.pikabu.ru/post_img/big/2019/06/25/1/1561413897182026686.jpg"
    if (json.cover) {
        headerImage = "https://leonardo.osnova.io/" + json.cover.data.uuid;
    }
    const registrationDate = timeConverter(json.created);

    // setCounter('entries', 'Статьи', postsCount);
    // setCounter('comments', 'Комментарии', commentsCount);

    if (!$('#account_info').length) {
        $(comment).append( `
            <div id='account_info'>
                <div id='header_image' style='background-image: url("`+ headerImage +`")'></div>
                <div id='block_info'>
                    <b>Дата регистрации:</b> `+ registrationDate +` <br>
                    <b>Рейтинг:</b> `+ json.karma +` <br>
                    <b>Подписчиков:</b> `+ json.subscribers_count +` <br>
                    <b>Комментариев:</b> `+ json.counters.comments +` <br>
                    <b>Постов:</b> `+ json.counters.entries +` <br>
                </div>
            </div>
        ` );
    }
}

function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
}