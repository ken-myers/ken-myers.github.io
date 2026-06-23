$(document).ready(function() {
	var scrollWidth = window.innerWidth-$(document).width();
	var modalLoadToken = 0;

	$(".clickToModal").on("click", function() {
		var previewSrc = $(this).attr("src");
		var pixelSrc = $(this).attr("pixelSrc") || previewSrc;

		if($(this).hasClass('photoImg')){
			var imgSrc = $(this).attr("fullSrc");
		}else{
			var imgSrc = $(this).attr("src");
		}

		modalLoadToken += 1;
		var loadToken = modalLoadToken;

		if(previewSrc && previewSrc != imgSrc){
			$('#modalImage')
				.addClass('loadingFullImage')
				.attr('src', pixelSrc);

			var swapFullImage = function() {
				if(loadToken != modalLoadToken) return;
				$('#modalImage')
					.attr('src', imgSrc)
					.removeClass('loadingFullImage');
			};

			var fullImage = new Image();
			if(fullImage.decode){
				fullImage.src = imgSrc;
				fullImage.decode().then(swapFullImage).catch(swapFullImage);
			}else{
				fullImage.onload = swapFullImage;
				fullImage.onerror = swapFullImage;
				fullImage.src = imgSrc;
			}
		}else{
			$('#modalImage')
				.removeClass('loadingFullImage')
				.attr('src', imgSrc);
		}

	   	$('#modalNewTabLink').attr('href', imgSrc);
	   	$('body').css('overflow', 'hidden');
	   	$('body').css('padding-right','+='+scrollWidth);
		$('#modalBackdrop').css('display','flex');
	});

	$("#modalBackdrop").on("click",function(e){
		if(e.target==this){
			$("#modalBackdrop").css('display','none')
			modalLoadToken += 1;
			$('#modalImage').removeClass('loadingFullImage');
			$('body').css('padding-right','-='+scrollWidth)
			$('body').css('overflow', 'auto');
		}
	});

	var galleryFrame = null;
	var galleries = Array.from(document.querySelectorAll('.gallery'));
	var loneLastRowQuery = window.matchMedia('(max-width: 700px)');

	function updateGalleryLastRows() {
		galleryFrame = null;

		galleries.forEach(function(gallery) {
			if(!loneLastRowQuery.matches){
				gallery.classList.remove('loneLastRow');
				return;
			}

			var photos = Array.from(gallery.querySelectorAll('.photo'));
			var lastPhoto = photos[photos.length - 1];

			if(!lastPhoto){
				gallery.classList.remove('loneLastRow');
				return;
			}

			var lastTop = lastPhoto.offsetTop;
			var photosInLastRow = photos.filter(function(photo) {
				return Math.abs(photo.offsetTop - lastTop) <= 1;
			}).length;

			gallery.classList.toggle('loneLastRow', photosInLastRow == 1);
		});
	}

	function scheduleGalleryLastRowUpdate() {
		if(galleryFrame !== null) return;
		galleryFrame = window.requestAnimationFrame(updateGalleryLastRows);
	}

	if(galleries.length){
		scheduleGalleryLastRowUpdate();

		if('ResizeObserver' in window){
			var galleryResizeObserver = new ResizeObserver(scheduleGalleryLastRowUpdate);
			galleries.forEach(function(gallery) {
				galleryResizeObserver.observe(gallery);
			});
		}else{
			window.addEventListener('resize', scheduleGalleryLastRowUpdate);
		}

		if(loneLastRowQuery.addEventListener){
			loneLastRowQuery.addEventListener('change', scheduleGalleryLastRowUpdate);
		}else{
			loneLastRowQuery.addListener(scheduleGalleryLastRowUpdate);
		}
	}
});
