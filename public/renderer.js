document.addEventListener('DOMContentLoaded', () => {
  const uploadTable = document.getElementById('upload-table');
  const addClipBtn = document.getElementById('add-clip-btn');
  const generateVideoBtn = document.getElementById('generate-video-btn');
  var videoIndex = 0;

  generateVideoBtn.addEventListener('click', () => {
    const videoInputButtons = document.getElementsByClassName('videoInputButton')
    const videoPaths = Array.from(videoInputButtons)
      .map(input => input.path) // Extract the path of the first file (if it exists)
      .filter(path => path);

    if (videoPaths.length < 2) {
      alert('Please select at least two videos!');
      return;
    }
  
    // Send selected videos to main process
    window.electronAPI.send('generate-video', videoPaths);
  });

  // Helper to create a table row
  const createTableRow = () => {
    const row = document.createElement('tr');
    row.className = 'border-b border-gray-700';
    const videoButtonId = `selectVideoButton-${videoIndex}`;
    const videoDisplayId = `selectVideoDisplay-${videoIndex}`;

    row.innerHTML = `
      <td class="px-4 py-4">
      <div class="flex items-center space-x-4 ">
        <!-- Button -->
        <label>
          <span
            id="${videoButtonId}"
            class="fileInputButton videoInputButton inline-block px-4 py-2 bg-blue-600 text-white font-medium text-center rounded-md cursor-pointer hover:bg-blue-500 active:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-400"
          >
            Select Video
          </span>
        </label>
        <!-- File Name Display -->
        <span id="${videoDisplayId}" class="text-gray-200 text-base font-semibold file-name truncate max-w-[8rem] overflow-hidden whitespace-nowrap">No clip selected</span>
      </div>
    </td>

    <!-- Widget Input -->
    <td class="px-4 py-2">
      <div class="flex items-center space-x-4">
        <!-- Button -->
        <label>
          <span
            id="selectWidgetButton-${videoIndex}"
            class="fileInputButton inline-block px-4 py-2 bg-blue-600 text-white font-medium text-center rounded-md cursor-pointer hover:bg-blue-500 active:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-400"
          >
            Select Widget
          </span>
        </label>
        <!-- File Name Display -->
        <span id="id="selectWidgetButton-display-${videoIndex}" class="text-gray-200 text-base font-semibold file-name truncate max-w-[8rem] overflow-hidden whitespace-nowrap">No widget selected</span>
      </div>
    </td>

    <!-- Remove Button -->
    <td class="px-4 py-2 text-right">
      <button
        id="remove-btn-${videoIndex}"
        class="remove-row-btn text-red-600 hover:text-red-800 focus:outline-none"
        aria-label="Remove row"
      >
        ✕
      </button>
    </td>
    `;

    uploadTable.appendChild(row);

    // Attach event listener to the select video button
    const videoButton = document.getElementById(videoButtonId);
    videoButton.addEventListener('click', async () => {
      const filters = [{ name: 'Videos', extensions: ['mp4', 'avi', 'mov'] }]; // Example filters
      const filePath = await window.electronAPI.selectFile(filters);

      if (filePath) {
        videoButton.path = filePath;
        checkGenerateVideoState();
        
        const videoDisplay = document.getElementById(videoDisplayId);
        videoDisplay.textContent = truncateFileName(filePath, 30); // Update file display
      }
    });

    // Attach event listener to the remove button
    const container = document.getElementById('upload-table')
    const removeButton = document.getElementById(`remove-btn-${videoIndex}`);
    removeButton.addEventListener('click', () => {
      if (container.children.length > 1) {
        container.removeChild(row); // Remove the row
        checkGenerateVideoState();

      } else {
        alert('At least one row must remain.');
      }
    });

    videoIndex++; // Increment the index for the next row
  };


  // Add the first two rows initially
  createTableRow();
  createTableRow();

  // Add new row on button click
  addClipBtn.addEventListener('click', () => {
    createTableRow();
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
  
  // Handle success and error responses
  window.electronAPI.receive('generate-video-success', (outputPath) => {
    alert(`Video successfully generated: ${outputPath}`);
  });
  
  window.electronAPI.receive('generate-video-error', (error) => {
    alert(`Error generating video: ${error}`);
  });

  const setCreateVideoState = (enable) => {
    if (enable) {
      generateVideoBtn.disabled = false;
      generateVideoBtn.classList.remove('bg-gray-600', 'text-gray-400', 'cursor-not-allowed');
      generateVideoBtn.classList.add('bg-green-600', 'text-white', 'hover:bg-green-500', 'active:bg-green-700');
    } else {
      generateVideoBtn.disabled = true;
      generateVideoBtn.classList.add('bg-gray-600', 'text-gray-400', 'cursor-not-allowed');
      generateVideoBtn.classList.remove('bg-green-600', 'text-white', 'hover:bg-green-500', 'active:bg-green-700');
    }
  };

  const checkGenerateVideoState = () => {
    const videoInputButtons = document.getElementsByClassName('videoInputButton')
    const videoPaths = Array.from(videoInputButtons)
      .map(input => input.path) // Extract the path of the first file (if it exists)
      .filter(path => path);

    setCreateVideoState(videoPaths.length >= 2);
  }

});


function truncateFileName(filePath, maxLength) {
  if (filePath.length > maxLength) {
    return filePath.slice(0, maxLength) + '...';
  }
  return filePath;
}