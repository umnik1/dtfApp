$(document).ready(function(){
    setInterval(function() {
        // Изображения
        $("img").each(function() { 
            if (this.src.includes('preview')) {
                var link = this.src.replace("/-/preview", "");
                link = link.replace("/webp/", "/jpg/");
                $(this).attr('src', link);
                $(this).after( '<p class="download_image" link="'+ link +'"><svg class="icon icon--ui_download" width="20" height="20"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#ui_download"></use></svg></p>');
            }
        });
        
        // Обложка
        if (window.location.href.indexOf("/u/") != -1) {
            if ($('.v-header-cover').length) {
                var bg = $('.v-header-cover').css('background-image').replace(/^url\(['"](.+)['"]\)/, '$1');
                if (bg.includes('scale_crop')) {
                    bg = bg.replace("-/scale_crop/960/-/format/webp/", "format/png/");
                    $('.v-header-cover').css('background-image', 'url('+ bg +')');
                }
            }
        }

      }, 1000);
      
  // Скачивание
  $(document).on('click','.download_image', function(){
    var time = new Date().getTime() / 1000;
    var link = $(this).attr('link');
    link = link.split('/');
    link.splice(4);
    var fixed_link = '';
    for (var i = 0; i < link.length; i++) {
      fixed_link += link[i]+'/';
    }
    console.log(fixed_link);

    saveAs(fixed_link, time + ".png");
  });

});
