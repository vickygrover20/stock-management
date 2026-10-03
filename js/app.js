async function loadProducts() {

    const response = await fetch("data/products.json");

    const products = await response.json();

    const container = document.getElementById("products");

    products.forEach(product => {

        const card = document.createElement("div");

        card.innerHTML = `
            <h2>${product.product_name}</h2>

            <p>
                Product Code: ${product.product_code}
            </p>

            <p>
                QR Code: ${product.qr_code}
            </p>

            <p>
                Category: ${product.category}
            </p>

            <p>
                Current Stock: ${product.quantity}
            </p>

            <p>
                Selling Price: ₹${product.selling_price}
            </p>
        `;

        container.appendChild(card);
    });
}

loadProducts();
