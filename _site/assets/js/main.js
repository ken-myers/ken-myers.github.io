$(document).ready(function() {
	var scrollWidth = window.innerWidth-$(document).width();
	$(".modalLink").on("click", function() {
		var imgSrc = $(this).attr("src");
	   	$('#modalImage').attr('src', imgSrc);
	   	$('body').css('overflow', 'hidden');
	   	$('body').css('padding-right','+='+scrollWidth)
		$('#imageModal').css('display','block');
	});

	$("#imageModal").on("click",function(e){
		if(e.target==this){
			$("#imageModal").css('display','none')
			$('body').css('padding-right','-='+scrollWidth)
			$('body').css('overflow', 'auto');
		}
	});
});

