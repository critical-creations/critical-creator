const uploadTable = document.getElementById('upload-table');
const addClipBtn = document.getElementById('add-clip-btn');
const generateVideoBtn = document.getElementById('generate-video-btn');

// Helper to create a table row
const createTableRow = (index) => {
  const row = document.createElement('tr');
  row.className = 'border-b border-gray-700';

  row.innerHTML = `
    <td class="px-4 py-4">
    <div class="flex items-center space-x-4">
      <!-- Button -->
      <label>
        <span
          class="inline-block px-4 py-2 bg-blue-600 text-white font-medium text-center rounded-md cursor-pointer hover:bg-blue-500 active:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-400"
        >
          Select Video
        </span>
        <input
          type="file"
          accept="video/*"
          class="hidden video-input"
        />
      </label>
      <!-- File Name Display -->
      <span class="text-gray-200 text-base font-semibold file-name truncate max-w-[8rem] overflow-hidden whitespace-nowrap">No clip selected</span>
    </div>
  </td>

  <!-- Widget Input -->
  <td class="px-4 py-2">
    <div class="flex items-center space-x-4">
      <!-- Button -->
      <label>
        <span
          class="inline-block px-4 py-2 bg-blue-600 text-white font-medium text-center rounded-md cursor-pointer hover:bg-blue-500 active:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-400"
        >
          Select Widget
        </span>
        <input
          type="file"
          accept="image/*"
          class="hidden widget-input"
        />
      </label>
      <!-- File Name Display -->
      <span class="text-gray-200 text-base font-semibold file-name truncate max-w-[8rem] overflow-hidden whitespace-nowrap">No widget selected</span>
    </div>
  </td>

  <!-- Remove Button -->
  <td class="px-4 py-2 text-right">
    <button
      class="remove-row-btn text-red-600 hover:text-red-800 focus:outline-none"
      aria-label="Remove row"
    >
      ✕
    </button>
  </td>
  `;

  // Add event listener to the video input
  const videoInput = row.querySelector('.video-input');
  videoInput.addEventListener('change', checkVideoUploadStatus);

  return row;
};

// Check if at least one video has been uploaded
const checkVideoUploadStatus = () => {
  const videoInputs = document.querySelectorAll('.video-input');
  const hasVideo = Array.from(videoInputs).some((input) => input.files.length > 0);

  if (hasVideo) {
    generateVideoBtn.disabled = false;
    generateVideoBtn.classList.remove('bg-gray-600', 'text-gray-400', 'cursor-not-allowed');
    generateVideoBtn.classList.add('bg-green-600', 'text-white', 'hover:bg-green-500', 'active:bg-green-700');
  } else {
    generateVideoBtn.disabled = true;
    generateVideoBtn.classList.add('bg-gray-600', 'text-gray-400', 'cursor-not-allowed');
    generateVideoBtn.classList.remove('bg-green-600', 'text-white', 'hover:bg-green-500', 'active:bg-green-700');
  }
};

// Add the first row initially
uploadTable.appendChild(createTableRow(0));

// Add new row on button click
addClipBtn.addEventListener('click', () => {
  const rowCount = uploadTable.children.length;
  const newRow = createTableRow(rowCount);
  uploadTable.appendChild(newRow);
});


document.addEventListener('DOMContentLoaded', () => {
  const fileInputs = document.querySelectorAll('.video-input, .widget-input');

  fileInputs.forEach((input) => {
    input.addEventListener('change', () => {
      const fileName = input.files.length ? input.files[0].name : 'No file selected';
      const fileNameDisplay = input.closest('td').querySelector('.file-name');
      fileNameDisplay.textContent = fileName;
    });
  });

  // Handle row removal
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-row-btn')) {
      const row = event.target.closest('tr'); // Find the closest <tr> element
      if (row) {
        row.remove();
      }
    }
  });
});
