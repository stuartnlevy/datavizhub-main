document.addEventListener('DOMContentLoaded', function() {
    //const apiEndpoint = 'https://datavizhub.clowderframework.org/api/datasets/6557a87be4b08520ac408e92/files';
    const apiEndpoint = 'https://datavizhub.clowderframework.org/api/datasets/66461b63e4b01d098f2777e6/files';
    const apiKey = '21335e14-10d2-4b97-8cdf-e661a4a7eee8';
    const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScNi9NpdsSJcEnBvK37ZHSnxC7ocZ2XxNZjkYtoxHWyigsb-A/viewform';
    
    // Add form field constants
    const FORM_FIELDS = {
        videoTitles: 'entry.1000023',  // Field ID for Videos Requested field
        requestor: 'entry.1000020',    // Field ID for Your name
        email: 'entry.1000025',        // Field ID for E-mail
        phone: 'entry.1000022'         // Field ID for Phone number
    };

    const gallery = document.getElementById('video-gallery');
    const searchInput = document.getElementById('search-input');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const modal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video');
    const cartModal = document.getElementById('cart-modal');
    const cartButton = document.getElementById('cart-button');
    const cartItems = document.getElementById('cart-items');
    const proceedToForm = document.getElementById('proceed-to-form');

    let cart = [];
    let videoData = [];

    function updateCartButton() {
        cartButton.textContent = `Cart (${cart.length})`;
    }

    function createGalleryItem(item) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';

        const fileId = item.id;
        const fileUrl = `https://datavizhub.clowderframework.org/api/files/${fileId}/blob?key=${apiKey}`;
        
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'thumbnail-container';

        // Add loading indicator
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'spinner';
        thumbnailContainer.appendChild(loadingSpinner);

        if (item.contentType.startsWith('video/')) {
            // Create preview video for hover
            const previewVideo = document.createElement('video');
            previewVideo.className = 'preview-video';
            previewVideo.src = fileUrl;
            previewVideo.muted = true;
            previewVideo.loop = true;
            previewVideo.crossOrigin = "anonymous";
            previewVideo.playsInline = true; // Add playsinline for iOS
            thumbnailContainer.appendChild(previewVideo);

            // Create thumbnail from video
            const thumbnailVideo = document.createElement('video');
            thumbnailVideo.src = fileUrl;
            thumbnailVideo.muted = true;
            thumbnailVideo.crossOrigin = "anonymous";
            thumbnailVideo.preload = 'metadata';
            thumbnailVideo.playsInline = true; // Add playsinline for iOS

            // Handle hover events
            galleryItem.addEventListener('mouseenter', () => {
                previewVideo.play().catch(e => console.log('Preview playback failed:', e));
            });

            galleryItem.addEventListener('mouseleave', () => {
                previewVideo.pause();
                previewVideo.currentTime = 0;
            });

            // Function to generate thumbnail
            const generateThumbnail = () => {
                const canvas = document.createElement('canvas');
                canvas.width = thumbnailVideo.videoWidth;
                canvas.height = thumbnailVideo.videoHeight;
                const context = canvas.getContext('2d');
                context.drawImage(thumbnailVideo, 0, 0, canvas.width, canvas.height);
                
                const thumbnail = document.createElement('img');
                thumbnail.src = canvas.toDataURL('image/jpeg');
                thumbnail.alt = item.filename;
                thumbnail.className = 'thumbnail';
                thumbnailContainer.appendChild(thumbnail);
                loadingSpinner.style.display = 'none';
                thumbnailVideo.remove();
            };

            // Try multiple times to get the thumbnail
            thumbnailVideo.addEventListener('loadedmetadata', () => {
                // Calculate the midpoint of the video
                const midpoint = thumbnailVideo.duration / 2;
                thumbnailVideo.currentTime = midpoint;
            });

            thumbnailVideo.addEventListener('seeked', () => {
                generateThumbnail();
            });

        } else if (item.contentType.startsWith('image/')) {
            // Handle TIFF files specially
            if (item.filename.toLowerCase().endsWith('.tif') || item.filename.toLowerCase().endsWith('.tiff')) {
                // Create a canvas element to convert TIFF to JPEG
                const img = new Image();
                img.crossOrigin = "anonymous";
                
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    // Convert to JPEG
                    const jpegUrl = canvas.toDataURL('image/jpeg');
                    
                    const thumbnail = document.createElement('img');
                    thumbnail.src = jpegUrl;
                    thumbnail.alt = item.filename;
                    thumbnail.className = 'thumbnail';
                    thumbnailContainer.appendChild(thumbnail);
                    loadingSpinner.style.display = 'none';
                };

                img.onerror = function() {
                    // Fallback to placeholder if TIFF loading fails
                    const thumbnail = document.createElement('img');
                    thumbnail.src = 'path/to/placeholder-image.jpg'; // Add a placeholder image
                    thumbnail.alt = 'Image preview not available';
                    thumbnail.className = 'thumbnail';
                    thumbnailContainer.appendChild(thumbnail);
                    loadingSpinner.style.display = 'none';
                };

                img.src = fileUrl;
            } else {
                // Handle other image formats normally
                const thumbnail = document.createElement('img');
                thumbnail.src = fileUrl;
                thumbnail.alt = item.filename;
                thumbnail.className = 'thumbnail';
                thumbnail.crossOrigin = "anonymous";
                thumbnail.onload = () => {
                    loadingSpinner.style.display = 'none';
                };
                thumbnailContainer.appendChild(thumbnail);
            }
        }

        const title = document.createElement('h3');
        title.textContent = item.filename;

        const addToCartBtn = document.createElement('button');
        addToCartBtn.className = 'cart-btn';
        addToCartBtn.textContent = 'Add to Cart';
        
        if (cart.includes(item.id)) {
            addToCartBtn.classList.add('in-cart');
            addToCartBtn.textContent = 'Remove from Cart';
        }

        addToCartBtn.onclick = (e) => {
            e.stopPropagation();
            if (!cart.includes(item.id)) {
                cart.push(item.id);
                addToCartBtn.textContent = 'Remove from Cart';
                addToCartBtn.classList.add('in-cart');
            } else {
                cart = cart.filter(id => id !== item.id);
                addToCartBtn.textContent = 'Add to Cart';
                addToCartBtn.classList.remove('in-cart');
            }
            updateCartButton();
        };

        galleryItem.appendChild(thumbnailContainer);
        galleryItem.appendChild(title);
        galleryItem.appendChild(addToCartBtn);

        galleryItem.addEventListener('click', () => {
            modal.style.display = 'block';
            document.getElementById('video-title').textContent = item.filename;
            
            if (item.contentType.startsWith('video/')) {
                modalVideo.style.display = 'block';
                modalVideo.setAttribute('controlsList', 'nodownload');
                modalVideo.oncontextmenu = function(e) { 
                    e.preventDefault(); 
                    return false; 
                };
                modalVideo.controls = true;
                modalVideo.playsInline = true; // Add playsinline for iOS
                modalVideo.style.pointerEvents = 'auto';
                modalVideo.src = fileUrl;
                modalVideo.play().catch(e => console.log('Modal playback failed:', e));
                document.querySelector('.modal-image')?.remove();
            } else if (item.contentType.startsWith('image/')) {
                modalVideo.style.display = 'none';
                let modalImage = document.querySelector('.modal-image');
                
                if (!modalImage) {
                    modalImage = document.createElement('img');
                    modalImage.className = 'modal-image';
                    modalImage.oncontextmenu = function(e) { 
                        e.preventDefault(); 
                        return false; 
                    };
                    modalVideo.parentNode.insertBefore(modalImage, modalVideo);
                }

                if (item.filename.toLowerCase().endsWith('.tif') || item.filename.toLowerCase().endsWith('.tiff')) {
                    // Convert TIFF to JPEG for display
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        modalImage.src = canvas.toDataURL('image/jpeg');
                    };
                    
                    img.src = fileUrl;
                } else {
                    modalImage.src = fileUrl;
                }
            }
        });

        return galleryItem;
    }

    function fetchData() {
        loadingIndicator.style.display = 'block';
        fetch(apiEndpoint, {
            headers: {
                'X-API-Key': apiKey
            }
        })
        .then(response => {
            loadingIndicator.style.display = 'none';
            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            videoData = data;
            gallery.innerHTML = '';
            data.forEach(item => {
                gallery.appendChild(createGalleryItem(item));
            });
        })
        .catch(error => {
            console.error('Error:', error);
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        });
    }

    cartButton.onclick = () => {
        cartItems.innerHTML = '';
        if (cart.length === 0) {
            cartItems.innerHTML = '<p>Your cart is empty</p>';
            proceedToForm.style.display = 'none';
        } else {
            cart.forEach(id => {
                const item = videoData.find(v => v.id === id);
                if (item) {
                    const itemEl = document.createElement('div');
                    itemEl.className = 'cart-item';
                    itemEl.innerHTML = `
                        <span>${item.filename}</span>
                        <button onclick="this.parentElement.remove();cart=cart.filter(i=>i!=='${id}');updateCartButton();">Remove</button>
                    `;
                    cartItems.appendChild(itemEl);
                }
            });
            proceedToForm.style.display = 'block';
        }
        cartModal.style.display = 'block';
    };

    proceedToForm.onclick = () => {
        const videoTitles = cart.map(id => {
            const item = videoData.find(v => v.id === id);
            return item ? item.filename.trim() : '';
        }).filter(title => title).join(', ');
    
        // Build the URL with all form fields
        let formUrl = googleFormUrl + '?';
        
        // Add video titles
        formUrl += `${FORM_FIELDS.videoTitles}=${encodeURIComponent(videoTitles)}`;
        
        window.open(formUrl, '_blank');
    };

    document.querySelectorAll('.close, .close-cart').forEach(closeBtn => {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
            cartModal.style.display = 'none';
            modalVideo.pause();
            modalVideo.currentTime = 0;
        };
    });

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            modalVideo.pause();
            modalVideo.currentTime = 0;
        } else if (event.target == cartModal) {
            cartModal.style.display = 'none';
        }
    };

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const items = document.querySelectorAll('.gallery-item');
        items.forEach(item => {
            const title = item.querySelector('h3').textContent.toLowerCase();
            item.style.display = title.includes(query) ? 'block' : 'none';
        });
    });

    // Prevent save shortcut
    document.addEventListener('keydown', function(e) {
        if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
        }
    });

    fetchData();
});