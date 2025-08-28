// --- Smooth Scrolling for all internal links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// --- Sticky Header with a transition effect ---
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// --- Scroll-to-reveal animations for feature cards and testimonials ---
const elementsToAnimate = document.querySelectorAll('.feature, .testimonial');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      if (entry.target.classList.contains('feature')) {
        entry.target.classList.add('show-feature');
      } else {
        entry.target.classList.add('show-testimonial');
      }
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.5
});

elementsToAnimate.forEach(el => observer.observe(el));

// --- Dark Mode Toggle ---
const toggleButton = document.getElementById('mode-toggle');
const body = document.body;

toggleButton.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  if (body.classList.contains('dark-mode')) {
    toggleButton.textContent = 'Toggle Light Mode';
  } else {
    toggleButton.textContent = 'Toggle Dark Mode';
  }
});

// --- Gemini API Integration for the FAQ Section ---
const askButton = document.getElementById('ask-button');
const questionInput = document.getElementById('user-question');
const answerDiv = document.getElementById('faq-answer');
const loadingIndicator = document.getElementById('loading-indicator');

askButton.addEventListener('click', async () => {
  const userQuery = questionInput.value.trim();
  if (userQuery === '') {
    // Show a message if the input is empty
    answerDiv.style.display = 'block';
    answerDiv.innerHTML = '<p style="color: red;">Please enter a question to ask.</p>';
    return;
  }

  // Show loading state and clear previous answer
  loadingIndicator.style.display = 'block';
  answerDiv.style.display = 'none';
  answerDiv.innerHTML = '';
  
  const apiKey = "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
  
  const systemPrompt = `You are LandiAI, an AI assistant for the landing page builder "Landify". Your purpose is to answer user questions about the product. Landify is a platform for creating stunning landing pages. Its key features are:
  - **Fast:** It has blazing fast performance.
  - **Secure:** It uses top-notch security with SSL encryption.
  - **Easy:** It has a simple and intuitive design for everyone, with no coding skills needed.
  Answer the user's question concisely and accurately, referencing these features and the product's purpose.`;
  
  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    tools: [{ "google_search": {} }],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
  };

  let response;
  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 1000;

  while (retryCount < maxRetries) {
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        const candidate = result?.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
          const text = candidate.content.parts[0].text;
          answerDiv.innerHTML = `<p>${text}</p>`;

          let sources = [];
          const groundingMetadata = candidate.groundingMetadata;
          if (groundingMetadata && groundingMetadata.groundingAttributions) {
              sources = groundingMetadata.groundingAttributions
                  .map(attribution => ({
                      uri: attribution.web?.uri,
                      title: attribution.web?.title,
                  }))
                  .filter(source => source.uri && source.title);
          }
          
          if (sources.length > 0) {
            const sourcesHtml = sources.map(source => `<a href="${source.uri}" target="_blank" style="color: #1abc9c; text-decoration: none;">${source.title}</a>`).join(', ');
            answerDiv.innerHTML += `<p style="font-size: 0.8em; margin-top: 10px; opacity: 0.8;">Source(s): ${sourcesHtml}</p>`;
          }
          
        } else {
          answerDiv.innerHTML = `<p style="color: red;">Sorry, I couldn't generate a response for that. Please try another question.</p>`;
        }
        break; // Exit the loop on success
      } else {
        // Handle HTTP errors
        console.error(`HTTP error! status: ${response.status}`);
        if (response.status === 429) {
          // Too many requests, retry with exponential backoff
          retryCount++;
          const delay = retryDelay * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          answerDiv.innerHTML = `<p style="color: red;">An error occurred. Please try again later.</p>`;
          break; // Exit the loop on other errors
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      answerDiv.innerHTML = `<p style="color: red;">An error occurred. Please check your network connection and try again.</p>`;
      break; // Exit the loop on fetch error
    }
  }

  // Hide loading state and show answer
  loadingIndicator.style.display = 'none';
  answerDiv.style.display = 'block';
});
