import { useState } from 'react';
import { documentAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [documentType, setDocumentType] = useState('bns');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [currentFile, setCurrentFile] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  const documentTypes = [
    { value: 'constitution', label: 'Constitution' },
    { value: 'ipc', label: 'IPC' },
    { value: 'crpc', label: 'CrPC' },
    { value: 'bns', label: 'BNS 2024' },
    { value: 'bnss', label: 'BNSS 2024' },
    { value: 'bsa', label: 'BSA 2024' },
    { value: 'supreme_court', label: 'Supreme Court' },
    { value: 'high_court', label: 'High Court' },
    { value: 'other', label: 'Other' },
  ];

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const pdfFiles = selectedFiles.filter(file => file.name.endsWith('.pdf'));
    
    if (pdfFiles.length !== selectedFiles.length) {
      alert('Only PDF files are allowed. Non-PDF files were filtered out.');
    }
    
    setFiles(pdfFiles);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setResults([]);
    setCurrentFile(0);

    const uploadResults = [];

    for (let i = 0; i < files.length; i++) {
      setCurrentFile(i + 1);
      setUploadProgress(0);
      const formData = new FormData();
      formData.append('file', files[i]);
      formData.append('document_type', documentType);

      try {
        const response = await documentAPI.upload(formData, (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        });
        uploadResults.push({ success: true, data: response.data, filename: files[i].name });
      } catch (error) {
        uploadResults.push({ 
          success: false, 
          error: error.code === 'ECONNABORTED' ? 'Upload timeout - file too large or processing took too long' : (error.response?.data?.detail || error.message),
          filename: files[i].name 
        });
      }
    }

    setResults(uploadResults);
    setFiles([]);
    setUploading(false);
    setCurrentFile(0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Upload Document</h1>
        <p className="text-gray-600 mt-1">Add new legal document to knowledge base</p>
      </div>

      <form onSubmit={handleUpload} className="card space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select PDF File *
          </label>
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-sm font-medium text-gray-700">{files.length} file(s) selected:</p>
              {files.map((file, idx) => (
                <p key={idx} className="text-sm text-gray-600 ml-2">
                  • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Document Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type *
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="input-field"
            required
          >
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={files.length === 0 || uploading}
            className="btn-primary flex-1"
          >
            {uploading ? (
              <span>
                Processing {currentFile}/{files.length}... {uploadProgress > 0 && `(${uploadProgress}%)`}
              </span>
            ) : (
              `Upload & Process ${files.length} File(s)`
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Processing Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Upload Results ({results.length} files)</h3>
          
          {results.map((result, idx) => (
            <div key={idx} className={`card ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className={`font-bold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? '✅' : '❌'} {result.filename}
                  </h4>
                  
                  {result.success ? (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-gray-600">Pages</p>
                        <p className="text-lg font-bold text-green-700">{result.data.processing_stats.pages_extracted}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Chunks</p>
                        <p className="text-lg font-bold text-green-700">{result.data.processing_stats.chunks_created}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Embeddings</p>
                        <p className="text-lg font-bold text-green-700">{result.data.processing_stats.embeddings_generated}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Time</p>
                        <p className="text-lg font-bold text-green-700">{result.data.processing_time_seconds}s</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-red-700">Error: {result.error}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => navigate('/documents')}
            className="btn-primary w-full"
          >
            View All Documents
          </button>
        </div>
      )}
    </div>
  );
}
