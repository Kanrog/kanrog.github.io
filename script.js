// Contact Form Handler
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formMessage = document.getElementById('formMessage');
    const submitBtn = document.querySelector('.submit-btn');
    const form = e.target;
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    try {
        // Use EmailJS service for reliable email sending
        const formData = new FormData(form);
        
        // Create mailto link as fallback
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');
        
        const subject = encodeURIComponent('Contact from Kanrog Creations Website');
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
        const mailtoLink = `mailto:kanrogcreations@gmail.com?subject=${subject}&body=${body}`;
        
        // Try FormSubmit.co first
        const response = await fetch('https://formsubmit.co/ajax/kanrogcreations@gmail.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                email: email,
                message: message,
                _subject: 'New Contact Form Submission - Kanrog Creations',
                _template: 'table',
                _captcha: 'false'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                formMessage.className = 'form-message success';
                formMessage.textContent = '✓ Message sent successfully! I\'ll get back to you soon.';
                form.reset();
            } else {
                throw new Error('Form submission failed');
            }
        } else {
            throw new Error('Network error');
        }
    } catch (error) {
        // Fallback to mailto
        formMessage.className = 'form-message error';
        formMessage.innerHTML = `
            ✗ Unable to send automatically. 
            <a href="mailto:kanrogcreations@gmail.com?subject=Contact%20from%20Website&body=Hi%20Kanrog,%0A%0A" 
               style="color: #e74c3c; text-decoration: underline;">
               Click here to email directly
            </a>
        `;
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
        
        // Hide message after 8 seconds
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 8000);
    }
});

// Add smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add intersection observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('.links-section, .contact-section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Add particle effect on logo hover
const logo = document.querySelector('.logo');
if (logo) {
    logo.addEventListener('mouseenter', function() {
        this.style.filter = 'drop-shadow(0 0 30px rgba(155, 89, 182, 0.8))';
    });
    
    logo.addEventListener('mouseleave', function() {
        this.style.filter = 'drop-shadow(0 0 20px rgba(155, 89, 182, 0.5))';
    });
}

// Add click tracking for analytics (optional)
document.querySelectorAll('.link-card').forEach(card => {
    card.addEventListener('click', function() {
        const platform = this.querySelector('span').textContent;
        console.log(`Clicked on ${platform} link`);
        // You can add analytics tracking here if needed
    });
});