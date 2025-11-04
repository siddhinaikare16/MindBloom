document.addEventListener('DOMContentLoaded', () => {
  const postsContainer = document.getElementById('posts-container');
  const postForm = document.getElementById('post-form');
  const formFeedback = document.getElementById('form-feedback');
  const postButton = document.getElementById('post-button');
  const postButtonText = document.getElementById('post-button-text');
  const postSpinner = document.getElementById('post-spinner');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const postNameInput = document.getElementById('post-name');

  const token = localStorage.getItem('token');
  let postsToShow = 5;
  let allPosts = [];

  // Update button text based on name input
  postNameInput.addEventListener('input', () => {
      if (postNameInput.value.trim()) {
          postButtonText.textContent = `Post as ${postNameInput.value.trim()}`;
      } else {
          postButtonText.textContent = 'Post Anonymously';
      }
  });

  // Fetch posts from backend
  async function loadPosts() {
    try {
      // const res = await fetch('http://localhost:4000/api/forum', {
      //above one changed to below for deployment
      const res = await fetch('https://mindbloom-8xjk.onrender.com/api/forum', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        allPosts = data.posts || [];
        renderPosts();
      } else {
        throw new Error(data.message || 'Failed to load posts');
      }
    } catch (err) {
      console.error(err);
      postsContainer.innerHTML = `<p class="text-center text-red-500">${err.message}</p>`;
    }
  }

  function renderPosts() {
    if (allPosts.length === 0) {
        postsContainer.innerHTML = '<p class="text-center text-gray-500">No stories shared yet. Be the first!</p>';
        loadMoreBtn.style.display = 'none';
        return;
    }
    
    postsContainer.innerHTML = ''; // Clear existing posts
    const visible = allPosts.slice(0, postsToShow);
    visible.forEach(post => {
      const div = document.createElement('div');
      div.className = 'bg-white p-6 rounded-xl shadow-md border border-gray-200';
      div.innerHTML = `
        <div>
          <h3 class="text-xl font-bold text-gray-800">${escapeHTML(post.title)}</h3>
          <p class="text-sm text-gray-500 mb-4">By ${escapeHTML(post.name)}</p>
          <p class="text-gray-700 whitespace-pre-wrap">${escapeHTML(post.content)}</p>
          <button class="like-btn text-gray-500 mt-4 flex items-center gap-2 hover:text-red-500 transition" data-id="${post._id}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            <span class="like-count font-semibold">${post.likes || 0}</span>
          </button>
        </div>`;
      postsContainer.appendChild(div);
    });

    loadMoreBtn.style.display = postsToShow >= allPosts.length ? 'none' : 'inline-block';
  }

  // Submit new post
  postForm.addEventListener('submit', async e => {
    e.preventDefault();
    const title = document.getElementById('post-title').value.trim();
    const name = document.getElementById('post-name').value.trim() || 'Anonymous';
    const content = document.getElementById('post-content').value.trim();
    const category = document.getElementById('post-category').value;

    if (!title || !content || !category) {
      showFeedback('Please fill out all required fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      // const res = await fetch('http://localhost:4000/api/forum', {
      //above one changed to below for deployment
      const res = await fetch('https://mindbloom-8xjk.onrender.com/api/forum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, name, content, category })
      });
      const data = await res.json();
      if (data.success) {
        allPosts.unshift(data.post);
        renderPosts();
        postForm.reset();
        postButtonText.textContent = 'Post Anonymously';
        showFeedback('Your story has been shared!', 'success');
      } else {
        showFeedback(data.message || 'Failed to post', 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Server error. Could not post.', 'error');
    } finally {
      setLoading(false);
    }
  });

  // Handle likes
  postsContainer.addEventListener('click', async e => {
    const btn = e.target.closest('.like-btn');
    if (!btn) return;
    const postId = btn.dataset.id;
    btn.disabled = true; // Prevent double-clicking

    try {
      // const res = await fetch(`http://localhost:4000/api/forum/${postId}/like`, {
      //above one changed to below for deployment
      const res = await fetch(`https://mindbloom-8xjk.onrender.com/api/forum/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const post = allPosts.find(p => p._id === postId);
        post.likes = data.likes;
        btn.querySelector('.like-count').textContent = post.likes;
        btn.classList.add('text-red-500'); // Show immediate feedback
      }
    } catch (err) {
      console.error(err);
    } finally {
      btn.disabled = false;
    }
  });

  loadMoreBtn.addEventListener('click', () => {
    postsToShow += 5;
    renderPosts();
  });

  function showFeedback(msg, type) {
    formFeedback.textContent = msg;
    formFeedback.className = `text-center mb-4 h-5 ${type === 'error' ? 'text-red-500' : 'text-green-500'}`;
    setTimeout(() => formFeedback.textContent = '', 3000);
  }

  function setLoading(loading) {
    postButton.disabled = loading;
    postSpinner.classList.toggle('hidden', !loading);
  }

  function escapeHTML(str) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
  }

  loadPosts(); // Initial load
});