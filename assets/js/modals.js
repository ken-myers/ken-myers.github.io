$(document).ready(function() {
	var modalLoadToken = 0;
	var modalBodyState = null;
	var loadingEffects = [
		'memoryDecay',
		'trackingError',
		'datamoshBlocks',
		'staticPulse',
		'crtDamage'
	];

	function chooseModalLoadingEffect() {
		return loadingEffects[Math.floor(Math.random() * loadingEffects.length)];
	}

	function clearModalLoadingEffect() {
		$('#modalImageShell')
			.removeClass('loadingFullImage ' + loadingEffects.join(' '))
			.css('--modal-placeholder-src', '');
	}

	function setModalPlaceholderSource(src) {
		var placeholderSrc = src || '';

		if(placeholderSrc && placeholderSrc.indexOf('url(') !== 0){
			placeholderSrc = 'url("' + placeholderSrc.replace(/"/g, '\\"') + '")';
		}

		document.getElementById('modalImageShell').style.setProperty(
			'--modal-placeholder-src',
			placeholderSrc
		);
	}

	function imageSrcFromCssUrl(cssUrl) {
		var matches = (cssUrl || '').trim().match(/^url\((['"]?)(.*)\1\)$/);
		return matches ? matches[2] : '';
	}

	function getPhotoPlaceholderSource(image) {
		var photo = $(image).closest('.photo').get(0);

		if(!photo) return '';

		return window.getComputedStyle(photo).getPropertyValue('--placeholder-src').trim();
	}

	function initGalleryPlaceholders() {
		$('.photo.loadingPreview').each(function() {
			var photo = $(this);
			var image = photo.find('img.photoImg').get(0);

			function clearPreviewLoadingState() {
				photo.removeClass('loadingPreview ' + loadingEffects.join(' '));
			}

			function clearAfterDecode() {
				if(!image.naturalWidth){
					clearPreviewLoadingState();
					return;
				}

				if(image.decode){
					image.decode().then(clearPreviewLoadingState).catch(clearPreviewLoadingState);
				}else{
					clearPreviewLoadingState();
				}
			}

			photo.addClass(chooseModalLoadingEffect());

			if(!image) return;

			if(image.complete && image.naturalWidth){
				clearAfterDecode();
				return;
			}

			$(image).one('load error', function() {
				clearAfterDecode();
			});
		});
	}

	initGalleryPlaceholders();

	$(".clickToModal").on("click", function() {
		var previewSrc = $(this).attr("src");
		var placeholderSrc = getPhotoPlaceholderSource(this);
		var placeholderImageSrc = imageSrcFromCssUrl(placeholderSrc) || previewSrc;
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
			setModalPlaceholderSource(placeholderSrc || previewSrc);
			$('#modalImageShell').addClass('loadingFullImage ' + chooseModalLoadingEffect());

			$('#modalImage')
				.off('error.pixelPlaceholder')
				.one('error.pixelPlaceholder', function() {
					if(loadToken == modalLoadToken && placeholderImageSrc != previewSrc){
						$(this).attr('src', previewSrc);
						setModalPlaceholderSource(previewSrc);
					}
				})
				.attr('src', placeholderImageSrc);

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
