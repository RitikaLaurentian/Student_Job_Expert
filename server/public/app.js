document.getElementById('searchBtn').addEventListener('click', () => {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;
  searchJobs(query);
});

async function searchJobs(query) {
  const loading = document.getElementById('loading');
  const resultsDiv = document.getElementById('results');
  loading.style.display = 'block';
  resultsDiv.innerHTML = '';
  try {
    const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Search failed');
    displayResults(data.data);
  } catch (error) {
    resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
  } finally {
    loading.style.display = 'none';
  }
}

function displayResults(jobs) {
  const resultsDiv = document.getElementById('results');
  if (!jobs || jobs.length === 0) {
    resultsDiv.innerHTML = '<div class="no-results">No jobs found.</div>';
    return;
  }
  const jobsHtml = jobs.map(job => `
    <div class="job-card">
      <h3>${job.job_title}</h3>
      <div class="employer">${job.employer_name || 'N/A'}</div>
      <div class="location">📍 ${job.job_location || 'Remote'}</div>
      ${job.job_min_salary && job.job_max_salary ? `<div class="salary">💰 $${job.job_min_salary} - $${job.job_max_salary} ${job.job_salary_period || ''}</div>` : ''}
      <div class="posted">📅 ${job.job_posted_at || 'Date not specified'}</div>
      <div class="button-group">
        <a href="${job.job_apply_link}" target="_blank" class="apply-btn">Apply Now</a>
        <button class="details-btn" data-job-id="${job.job_id}">Details</button>
      </div>
    </div>
  `).join('');
  resultsDiv.innerHTML = jobsHtml;
  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const jobId = btn.getAttribute('data-job-id');
      await showJobDetails(jobId);
    });
  });
}

async function showJobDetails(jobId) {
  try {
    const response = await fetch(`/api/job-details?job_id=${encodeURIComponent(jobId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch details');
    const job = data.data[0];
    const modalHtml = `
      <div class="modal-overlay" id="modalOverlay">
        <div class="modal">
          <button class="modal-close" id="closeModal">&times;</button>
          <h2>${job.job_title}</h2>
          <p><strong>${job.employer_name}</strong> – ${job.job_location}</p>
          ${job.job_min_salary && job.job_max_salary ? `<p><strong>Salary:</strong> $${job.job_min_salary} - $${job.job_max_salary} ${job.job_salary_period}</p>` : ''}
          <h3>Description</h3>
          <div class="description">${job.job_description || 'No description provided.'}</div>
          ${job.job_highlights ? `
            <h3>Highlights</h3>
            <ul>
              ${job.job_highlights.Qualifications ? `<li><strong>Qualifications:</strong> ${job.job_highlights.Qualifications.join(', ')}</li>` : ''}
              ${job.job_highlights.Responsibilities ? `<li><strong>Responsibilities:</strong> ${job.job_highlights.Responsibilities.join(', ')}</li>` : ''}
              ${job.job_highlights.Benefits ? `<li><strong>Benefits:</strong> ${job.job_highlights.Benefits.join(', ')}</li>` : ''}
            </ul>
          ` : ''}
          <a href="${job.job_apply_link}" target="_blank" class="apply-modal-btn">Apply Now</a>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('closeModal').addEventListener('click', () => document.getElementById('modalOverlay').remove());
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modalOverlay')) document.getElementById('modalOverlay').remove();
    });
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}