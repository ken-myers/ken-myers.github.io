$(document).ready(function() {
	var scrollWidth = window.innerWidth-$(document).width();
	$(".clickToModal").on("click", function() {
		var imgSrc = $(this).attr("src");
	   	$('#modalImage').attr('src', imgSrc);
	   	$('#modalNewTabLink').attr('href', imgSrc);
	   	$('body').css('overflow', 'hidden');
	   	$('body').css('padding-right','+='+scrollWidth);
		$('#modalBackdrop').css('display','flex');
	});

	$("#modalBackdrop").on("click",function(e){
		if(e.target==this){
			$("#modalBackdrop").css('display','none')
			$('body').css('padding-right','-='+scrollWidth)
			$('body').css('overflow', 'auto');
		}
	});
});