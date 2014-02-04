function fragmentRouting(defaultFragment, handlers, finallyHandler){
    function fragmentChange(fragment){
        $('.tab_page').hide()
        $('.tab_page_' + fragment).show()
        $('.tab_link').toggleClass('active', false)
        $('.tab_link_' + fragment).toggleClass('active', true)
        if (handlers && handlers[fragment])
            handlers[fragment](fragment)
        if (finallyHandler)
            finallyHandler(fragment)
    }
    function handleUrlChange(e){
        var tokens = e.newURL.split('#')
        fragmentChange((tokens.length === 2) ? tokens[1] : defaultFragment)
    }
    addEventListener('hashchange', handleUrlChange)
    handleUrlChange({ newURL: location.hash })
}