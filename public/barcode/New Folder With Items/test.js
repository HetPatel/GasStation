setTimeout(() => {
	$('.scan > input').focus()
}, 300)

$('.scan > input').on('keydown', (event) => {
	if (event.which === 13 || event.keyCode === 13) {
		$('.scan > input').blur()
		$('.next').click()
	}
})

$('.password > input').on('keydown', (event) => {
	if (event.which === 13 || event.keyCode === 13) {
		$('.login').click()
	}
})

$('.next').on('click', (event) => {
	let scanInput = $('.scan > input').val()
	event.preventDefault()
	$('.inputs').addClass('shift')
	$('.back').addClass('active-back')
	$('.scan > input').css({
		'border': '1px solid #cccccc'
	})
	$('.warning').empty()
	setTimeout(() => {
		$('.password > input').focus()
	}, 400)
	// if (validatescan(scanInput)) {
	// 	event.preventDefault()
	// 	$('.inputs').addClass('shift')
	// 	$('.back').addClass('active-back')
	// 	$('.scan > input').css({
	// 		'border': '1px solid #cccccc'
	// 	})
	// 	$('.warning').empty()
	// 	setTimeout(() => {
	// 		$('.password > input').focus()
	// 	}, 400)
	//
	// } else {
	// 	event.preventDefault()
	// 	$('.warning').empty()
	// 	$('.scan > input').css({
	// 		'border': '1px solid red'
	// 	})
	// 	$('.warning').append('Invalid scan Address')
	//
	// }
})

$('.back').on('click', (event) => {
	event.preventDefault()
	$('.inputs').removeClass('shift')
	$('.back').removeClass('active-back')
	setTimeout(() => {
		$('.scan > input').focus()
	}, 300)
})

$('.login').on('click', (event) => {
	event.preventDefault()
	$('form').empty()
	$('form').append('<div class="loader"></div>')
	setTimeout(() => {
		location = location
	}, 2000)
})

const validatescan = (scan) => {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	return re.test(scan)
}
