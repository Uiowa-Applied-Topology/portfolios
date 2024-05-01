window.onload = function () {
    // If absolute URL from the remote server is provided, configure the CORS
    // header on that server.

    var url = "";
    var hidePaginator = "" === "true";
    var hideLoader = " " === "true";
    var selectedPageNum = parseInt(" ") || 1;

    // Loaded via <script> tag, create shortcut to access PDF.js exports.
    var pdfjsLib = window['pdfjs-dist/build/pdf'];

    // The workerSrc property shall be specified.
    pdfjsLib.GlobalWorkerOptions.workerSrc = "{{.Site.BaseURL}}" + '/js/pdf-js/build/pdf.worker.js';

    // Change the Scale value for lower or higher resolution.
    var pdfDoc = null,
        pageNum = selectedPageNum,
        pageRendering = false,
        pageNumPending = null,
        scale = 3,
        canvas = document.getElementById('the-canvas'),
        ctx = canvas.getContext('2d'),
        paginator = document.getElementById("paginator"),
        loadingWrapper = document.getElementById('loadingWrapper');


    // Attempt to show paginator and loader if enabled
    showPaginator();
    showLoader();

    /**
        * Get page info from document, resize canvas accordingly, and render page.
        * @param num Page number.
        */
    function renderPage(num) {
        pageRendering = true;
        // Using promise to fetch the page
        pdfDoc.getPage(num).then(function (page) {
            var viewport = page.getViewport({ scale: scale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render PDF page into canvas context
            var renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            var renderTask = page.render(renderContext);

            // Wait for rendering to finish
            renderTask.promise.then(function () {
                pageRendering = false;
                showContent();

                if (pageNumPending !== null) {
                    // New page rendering is pending
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });
        });

        // Update page counters
        document.getElementById('page_num').textContent = num;
    }

    /**
        * Hides loader and shows canvas
        */
    function showContent() {
        loadingWrapper.style.display = 'none';
        canvas.style.display = 'block';
    }

    /**
        * If we haven't disabled the loader, show loader and hide canvas
        */
    function showLoader() {
        if (hideLoader) return
        loadingWrapper.style.display = 'flex';
        canvas.style.display = 'none';
    }

    /**
        * If we haven't disabled the paginator, show paginator
        */
    function showPaginator() {
        if (hidePaginator) return
        paginator.style.display = 'block';
    }

    /**
        * If another page rendering in progress, waits until the rendering is
        * finished. Otherwise, executes rendering immediately.
        */
    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }

    /**
        * Displays previous page.
        */
    function onPrevPage() {
        if (pageNum <= 1) {
            return;
        }
        pageNum--;
        queueRenderPage(pageNum);
    }
    document.getElementById('prev').addEventListener('click', onPrevPage);
    document.getElementById('prev2').addEventListener('click', onPrevPage);

    /**
        * Displays next page.
        */
    function onNextPage() {
        if (pageNum >= pdfDoc.numPages) {
            return;
        }
        pageNum++;
        queueRenderPage(pageNum);
    }
    document.getElementById('next').addEventListener('click', onNextPage);
    document.getElementById('next2').addEventListener('click', onNextPage);

    /**
        * Asynchronously downloads PDF.
        */
    pdfjsLib.getDocument(url).promise.then(function (pdfDoc_) {
        pdfDoc = pdfDoc_;
        var numPages = pdfDoc.numPages;
        document.getElementById('page_count').textContent = numPages;

        // If the user passed in a number that is out of range, render the last page.
        if (pageNum > numPages) {
            pageNum = numPages
        }

        // Initial/first page rendering
        renderPage(pageNum);
    });
}
