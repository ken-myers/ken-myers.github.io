$(document).ready(function() {
	var modalLoadToken = 0;
	var modalBodyState = null;
	var modalLoadingEffects = [
		'memoryDecay',
		'trackingError',
		'datamoshBlocks',
		'staticPulse',
		'crtDamage'
	];

	function chooseModalLoadingEffect() {
		return modalLoadingEffects[Math.floor(Math.random() * modalLoadingEffects.length)];
	}

	function clearModalLoadingEffect() {
		$('#modalImageShell')
			.removeClass('loadingFullImage ' + modalLoadingEffects.join(' '))
			.css('--modal-placeholder-src', '');
	}

	function setModalPlaceholderSource(src) {
		document.getElementById('modalImageShell').style.setProperty(
			'--modal-placeholder-src',
			'url("' + src.replace(/"/g, '\\"') + '")'
		);
	}

	$(".clickToModal").on("click", function() {
		var previewSrc = $(this).attr("src");
		var pixelSrc = $(this).attr("pixelSrc") || previewSrc;
		var intrinsicWidth = parseFloat($(this).attr("width")) || this.naturalWidth;
		var intrinsicHeight = parseFloat($(this).attr("height")) || this.naturalHeight;

		if(intrinsicWidth && intrinsicHeight){
			var maxModalWidth = window.innerWidth * 0.9;
			var maxModalHeight = window.innerHeight * 0.87;
			var aspect = intrinsicWidth / intrinsicHeight;
			var displayWidth = maxModalWidth;
			var displayHeight = displayWidth / aspect;

			if(displayHeight > maxModalHeight){
				displayHeight = maxModalHeight;
				displayWidth = displayHeight * aspect;
			}

			$('#modalImageShell').css({
				width: displayWidth,
				height: displayHeight
			});
		}else{
			$('#modalImageShell').css({
				width: '',
				height: ''
			});
		}

		if($(this).hasClass('photoImg')){
			var imgSrc = $(this).attr("fullSrc");
		}else{
			var imgSrc = $(this).attr("src");
		}

		modalLoadToken += 1;
		var loadToken = modalLoadToken;

		if(previewSrc && previewSrc != imgSrc){
			clearModalLoadingEffect();
			setModalPlaceholderSource(pixelSrc);
			$('#modalImageShell').addClass('loadingFullImage ' + chooseModalLoadingEffect());

			$('#modalImage')
				.off('error.pixelPlaceholder')
				.one('error.pixelPlaceholder', function() {
					if(loadToken == modalLoadToken && pixelSrc != previewSrc){
						$(this).attr('src', previewSrc);
						setModalPlaceholderSource(previewSrc);
					}
				})
				.attr('src', pixelSrc);

			var swapFullImage = function() {
				if(loadToken != modalLoadToken) return;
				$('#modalImage')
					.attr('src', imgSrc);
				clearModalLoadingEffect();
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
			clearModalLoadingEffect();
			$('#modalImage')
				.off('error.pixelPlaceholder')
				.attr('src', imgSrc);
		}

	   	$('#modalNewTabLink').attr('href', imgSrc);

		if(!modalBodyState){
			var currentPaddingRight = parseFloat($('body').css('padding-right')) || 0;
			var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

			modalBodyState = {
				overflow: $('body').css('overflow'),
				paddingRight: $('body').css('padding-right')
			};

			$('body').css({
				overflow: 'hidden',
				paddingRight: currentPaddingRight + scrollbarWidth
			});
		}

		$('#modalBackdrop').css('display','flex');
	});

	$("#modalBackdrop").on("click",function(e){
		if(e.target==this){
			$("#modalBackdrop").css('display','none')
			modalLoadToken += 1;
			$('#modalImage')
				.off('error.pixelPlaceholder');
			clearModalLoadingEffect();
			if(modalBodyState){
				$('body').css({
					overflow: modalBodyState.overflow,
					paddingRight: modalBodyState.paddingRight
				});
				modalBodyState = null;
			}
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
