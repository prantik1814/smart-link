import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, GripVertical, Copy, Check, HelpCircle, X, AlertCircle, CheckCircle } from 'lucide-react';

const CustomMusicForm = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState(initialData || {
    bandName: '',
    tagline: '',
    description: '',
    heroImage: '',
    backgroundImage: '',
    theme: {
      accentColor: '#ff6b6b',
      backgroundOverlay: 'rgba(4, 4, 12, 0.85)'
    },
    links: [
      {
        title: '',
        url: '',
        color: '#1DB954',
        iconUrl: ''
      }
    ]
  });

  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpPlatform, setHelpPlatform] = useState(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const platformExamples = {
    'Spotify': {
      color: '#1DB954',
      description: 'Spotify track or album links',
      examples: [
        'https://open.spotify.com/track/5ybQaZNqNbPgPaUx6lL0rU',
        'https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3',
        'https://open.spotify.com/artist/4q3ewBCX7sLwd24euuV69X'
      ],
      note: 'Must start with https://open.spotify.com/'
    },
    'YouTube': {
      color: '#FF0000',
      description: 'YouTube video links',
      examples: [
        'https://youtu.be/tBWiUvQj1AQ',
        'https://www.youtube.com/watch?v=tBWiUvQj1AQ',
        'https://youtube.com/watch?v=tBWiUvQj1AQ'
      ],
      note: 'Must be a valid YouTube video URL'
    },
    'YouTube Music': {
      color: '#FF0000',
      description: 'YouTube Music links',
      examples: [
        'https://music.youtube.com/watch?v=tBWiUvQj1AQ',
        'https://youtu.be/tBWiUvQj1AQ?si=grDxVVg9HeO0C1YX'
      ],
      note: 'Must start with https://music.youtube.com/'
    },
    'JioSaavn': {
      color: '#2BC5B4',
      description: 'JioSaavn song links',
      examples: [
        'https://www.saavn.com/song/wasted/GQUyXC5vYFg',
        'https://www.jiosaavn.com/song/wasted/GQUyXC5vYFg'
      ],
      note: 'Must start with https://www.saavn.com/ or https://www.jiosaavn.com/'
    },
    'Amazon Music': {
      color: '#00A8E1',
      description: 'Amazon Music album or track links',
      examples: [
        'https://music.amazon.in/albums/B0F3PDNCGZ',
        'https://music.amazon.com/albums/B0F3PDNCGZ',
        'https://amazon.in/music/B0F3PDNCGZ'
      ],
      note: 'Must be a valid Amazon Music URL'
    },
    'Apple Music': {
      color: '#fc3c44',
      description: 'Apple Music links',
      examples: [
        'https://music.apple.com/in/song/do-or-die/6766575394',
        'https://music.apple.com/us/album/do-or-die/6766575394'
      ],
      note: 'Must start with https://music.apple.com/'
    },
    'Gaana': {
      color: '#E72C30',
      description: 'Gaana song links',
      examples: [
        'https://gaana.com/song/wasted-1581',
        'https://gaana.com/album/wasted-123456'
      ],
      note: 'Must start with https://gaana.com/'
    },
    'SoundCloud': {
      color: '#FF5500',
      description: 'SoundCloud track links',
      examples: [
        'https://soundcloud.com/artist/track-name',
        'https://soundcloud.app.goo.gl/example'
      ],
      note: 'Must be a valid SoundCloud URL'
    },
    'Instagram': {
      color: '#E4405F',
      description: 'Instagram post or profile links',
      examples: [
        'https://www.instagram.com/p/ABC123/',
        'https://instagram.com/p/ABC123/',
        'https://www.instagram.com/username'
      ],
      note: 'Must be a valid Instagram URL'
    },
    'Facebook': {
      color: '#1877F2',
      description: 'Facebook post or page links',
      examples: [
        'https://www.facebook.com/username/posts/123456',
        'https://facebook.com/username'
      ],
      note: 'Must be a valid Facebook URL'
    },
    'Twitter': {
      color: '#1DA1F2',
      description: 'Twitter post or profile links',
      examples: [
        'https://twitter.com/username/status/123456',
        'https://x.com/username/status/123456'
      ],
      note: 'Must be a valid Twitter/X URL'
    },
    'Website': {
      color: '#6B7280',
      description: 'Personal website or custom links',
      examples: [
        'https://yourwebsite.com',
        'https://linktr.ee/yourname',
        'https://yourname.com/music'
      ],
      note: 'Any valid website URL'
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.bandName.trim()) newErrors.bandName = 'Band name is required';
    if (!formData.tagline.trim()) newErrors.tagline = 'Tagline is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    formData.links.forEach((link, index) => {
      if (!link.title.trim()) newErrors[`link_${index}_title`] = 'Platform name is required';
      if (!link.url.trim()) newErrors[`link_${index}_url`] = 'URL is required';
      else if (!validatePlatformUrl(link.title, link.url)) {
        newErrors[`link_${index}_url`] = `Invalid ${link.title} URL format`;
      }
      if (!link.color.trim()) newErrors[`link_${index}_color`] = 'Color is required';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleThemeChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        [field]: value
      }
    }));
  };

  const handleLinkChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
    
    const errorKey = `link_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const addLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, {
        title: '',
        url: '',
        color: '#1DB954',
        iconUrl: ''
      }]
    }));
  };

  const removeLink = (index) => {
    if (formData.links.length > 1) {
      setFormData(prev => ({
        ...prev,
        links: prev.links.filter((_, i) => i !== index)
      }));
    }
  };

  const moveLink = (index, direction) => {
    const newLinks = [...formData.links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newLinks.length) {
      [newLinks[index], newLinks[targetIndex]] = [newLinks[targetIndex], newLinks[index]];
      setFormData(prev => ({ ...prev, links: newLinks }));
    }
  };

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
    setDragOverIndex(index);
  };

  const handleDragEnd = (e) => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const newLinks = [...formData.links];
      const draggedIndex = dragItem.current;
      const targetIndex = dragOverItem.current;
      
      if (draggedIndex !== targetIndex) {
        const draggedItem = newLinks[draggedIndex];
        newLinks.splice(draggedIndex, 1);
        newLinks.splice(targetIndex, 0, draggedItem);
        
        setFormData(prev => ({ ...prev, links: newLinks }));
      }
    }
    
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const showPlatformHelp = (platformName) => {
    // Find the best matching platform
    const matchedPlatform = Object.keys(platformExamples).find(platform => 
      platform.toLowerCase() === platformName?.toLowerCase()
    ) || 'Spotify'; // Default to Spotify if no match
    setHelpPlatform(matchedPlatform);
    setShowHelpModal(true);
  };

  const closeHelpModal = () => {
    setShowHelpModal(false);
    setHelpPlatform(null);
  };

  const validatePlatformUrl = (platform, url) => {
    if (!url.trim()) return true; // Allow empty for now, validate on submit
    
    const platformData = platformExamples[platform];
    if (!platformData) return true; // Custom platform, allow any URL
    
    const urlLower = url.toLowerCase();
    
    switch (platform) {
      case 'Spotify':
        return urlLower.includes('open.spotify.com/');
      case 'YouTube':
        return urlLower.includes('youtube.com/watch') || urlLower.includes('youtu.be/');
      case 'YouTube Music':
        return urlLower.includes('music.youtube.com/');
      case 'JioSaavn':
        return urlLower.includes('saavn.com/') || urlLower.includes('jiosaavn.com/');
      case 'Amazon Music':
        return urlLower.includes('music.amazon.') || urlLower.includes('amazon.') && urlLower.includes('/music/');
      case 'Apple Music':
        return urlLower.includes('music.apple.com/');
      case 'Gaana':
        return urlLower.includes('gaana.com/');
      case 'SoundCloud':
        return urlLower.includes('soundcloud.com/');
      case 'Instagram':
        return urlLower.includes('instagram.com/');
      case 'Facebook':
        return urlLower.includes('facebook.com/');
      case 'Twitter':
        return urlLower.includes('twitter.com/') || urlLower.includes('x.com/');
      case 'Website':
        return urlLower.startsWith('http://') || urlLower.startsWith('https://');
      default:
        return true; // Allow any URL for unknown platforms
    }
  };

  const getUrlValidationStatus = (platform, url) => {
    if (!url.trim()) return { status: 'empty', message: '' };
    
    // Basic URL format check
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      return { status: 'invalid', message: 'URL must start with http:// or https://' };
    }
    
    // Platform-specific validation
    const platformData = platformExamples[platform];
    if (platformData && !validatePlatformUrl(platform, url)) {
      return { status: 'invalid', message: `Invalid ${platform} URL format` };
    }
    
    return { status: 'valid', message: 'Valid URL format' };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setFormData({
      bandName: '',
      tagline: '',
      description: '',
      heroImage: '',
      backgroundImage: '',
      theme: {
        accentColor: '#ff6b6b',
        backgroundOverlay: 'rgba(4, 4, 12, 0.85)'
      },
      links: [{ title: '', url: '', color: '#1DB954', iconUrl: '' }]
    });
    setErrors({});
  };

  
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-xl form-container">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Music Smart Link Configuration</h1>
        <p className="text-lg text-gray-600">Create your smart link with all music platforms</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Band Name *</label>
              <input
                type="text"
                value={formData.bandName}
                onChange={(e) => handleInputChange('bandName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your band name"
              />
              {errors.bandName && <p className="text-red-500 text-sm mt-1">{errors.bandName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline *</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your tagline"
              />
              {errors.tagline && <p className="text-red-500 text-sm mt-1">{errors.tagline}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your music or release"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
            Images
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image URL</label>
              <input
                type="url"
                value={formData.heroImage}
                onChange={(e) => handleInputChange('heroImage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/hero-image.jpg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
              <input
                type="url"
                value={formData.backgroundImage}
                onChange={(e) => handleInputChange('backgroundImage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/background.jpg"
              />
            </div>
          </div>
        </div>

        {/* Theme Section */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
            Theme Customization
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.theme.accentColor}
                  onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                  className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.theme.accentColor}
                  onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#ff6b6b"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Overlay</label>
              <input
                type="text"
                value={formData.theme.backgroundOverlay}
                onChange={(e) => handleThemeChange('backgroundOverlay', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="rgba(4, 4, 12, 0.85)"
              />
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
            Music Platform Links
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Add links to your music on all streaming platforms</p>
              <button
                type="button"
                onClick={() => showPlatformHelp('Spotify')}
                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>URL Examples</span>
              </button>
            </div>
            <div className="flex items-center space-x-2 text-xs text-blue-600">
              <GripVertical className="w-4 h-4" />
              <span>Drag the grip handle (⋮⋮) to reorder platforms</span>
            </div>

            {/* URL Validation Summary */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">URL Validation Status</h4>
              <div className="space-y-1">
                {formData.links.map((link, index) => {
                  const validation = getUrlValidationStatus(link.title, link.url);
                  return (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        {link.title || `Platform ${index + 1}`}:
                      </span>
                      <div className="flex items-center space-x-1">
                        {validation.status === 'valid' && (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span className="text-green-600">Valid</span>
                          </>
                        )}
                        {validation.status === 'invalid' && (
                          <>
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            <span className="text-red-600">Invalid</span>
                          </>
                        )}
                        {validation.status === 'empty' && (
                          <>
                            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                            <span className="text-gray-500">Empty</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {formData.links.map((link, index) => (
              <div
                key={index}
                className={`bg-white p-4 rounded-lg border-2 transition-all ${
                  dragOverIndex === index
                    ? 'border-blue-400 shadow-lg scale-105'
                    : 'border-gray-200'
                } ${draggedIndex === index ? 'opacity-50' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                    <span className="font-medium text-gray-700">Platform {index + 1}</span>
                    {draggedIndex === index && (
                      <span className="text-xs text-blue-600 font-medium">Dragging...</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => moveLink(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLink(index, 'down')}
                      disabled={index === formData.links.length - 1}
                      className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    {formData.links.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform Name *
                      <button
                        type="button"
                        onClick={() => showPlatformHelp(link.title || 'Spotify')}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                        title="See URL format examples"
                      >
                        <HelpCircle className="w-4 h-4 inline" />
                      </button>
                    </label>
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Spotify"
                    />
                    {errors[`link_${index}_title`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`link_${index}_title`]}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                    <div className="relative">
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                        className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                          (() => {
                            const validation = getUrlValidationStatus(link.title, link.url);
                            if (validation.status === 'valid') {
                              return 'border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-500';
                            } else if (validation.status === 'invalid') {
                              return 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500';
                            } else {
                              return 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
                            }
                          })()
                        }`}
                        placeholder="https://open.spotify.com/track/..."
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {(() => {
                          const validation = getUrlValidationStatus(link.title, link.url);
                          if (validation.status === 'valid') {
                            return <CheckCircle className="w-5 h-5 text-green-500" />;
                          } else if (validation.status === 'invalid') {
                            return <AlertCircle className="w-5 h-5 text-red-500" />;
                          } else {
                            return null;
                          }
                        })()}
                      </div>
                    </div>
                    {(() => {
                      const validation = getUrlValidationStatus(link.title, link.url);
                      if (validation.status === 'invalid') {
                        return (
                          <div className="mt-1 flex items-start space-x-1">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-red-500 text-sm">{validation.message}</p>
                          </div>
                        );
                      } else if (validation.status === 'valid') {
                        return (
                          <div className="mt-1 flex items-start space-x-1">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-green-600 text-sm">{validation.message}</p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {errors[`link_${index}_url`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`link_${index}_url`]}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color *</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={link.color}
                        onChange={(e) => handleLinkChange(index, 'color', e.target.value)}
                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={link.color}
                        onChange={(e) => handleLinkChange(index, 'color', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#1DB954"
                      />
                    </div>
                    {errors[`link_${index}_color`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`link_${index}_color`]}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon URL</label>
                    <input
                      type="text"
                      value={link.iconUrl}
                      onChange={(e) => handleLinkChange(index, 'iconUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="/icons/spotify.png"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addLink}
              className="w-full py-2 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Another Platform</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Reset Form
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            Generate Smart Link JSON
          </button>
        </div>
      </form>

      {/* JSON Output Section */}
      <div className="mt-12 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Generated JSON Configuration</h2>
            <p className="text-sm text-gray-600">Your complete smart link configuration ready to use</p>
          </div>
          <button
            onClick={copyToClipboard}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center gap-2 font-medium shadow-lg"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy JSON Configuration
              </>
            )}
          </button>
        </div>
        
        <div className="bg-gray-900 rounded-lg overflow-hidden shadow-inner">
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-400 text-sm ml-2">config.json</span>
            </div>
            <span className="text-gray-500 text-xs">{JSON.stringify(formData).length} characters</span>
          </div>
          <pre className="text-green-400 p-6 overflow-x-auto text-sm font-mono leading-relaxed">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
        
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Copy className="w-4 h-4 mr-2 text-blue-600" />
              Save as Config
            </h3>
            <p className="text-sm text-gray-600">Save this JSON as your configuration file</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-green-100">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Check className="w-4 h-4 mr-2 text-green-600" />
              Ready to Use
            </h3>
            <p className="text-sm text-gray-600">All links validated and ready for your smart link</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-purple-100">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Plus className="w-4 h-4 mr-2 text-purple-600" />
              Live Updates
            </h3>
            <p className="text-sm text-gray-600">JSON updates automatically as you fill the form</p>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: platformExamples[helpPlatform]?.color || '#6B7280' }}
                  ></div>
                  <h3 className="text-xl font-bold text-gray-900">{helpPlatform} URL Format</h3>
                </div>
                <button
                  type="button"
                  onClick={closeHelpModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Platform Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Platform:</label>
                <select
                  value={helpPlatform}
                  onChange={(e) => setHelpPlatform(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.keys(platformExamples).map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{platformExamples[helpPlatform].description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Valid URL Examples</h4>
                  <div className="space-y-2">
                    {platformExamples[helpPlatform].examples.map((example, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <code className="text-sm text-gray-800 break-all">{example}</code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(example);
                            // Could add toast notification here
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="w-4 h-4 inline" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Important Note</h4>
                  <p className="text-blue-800 text-sm">{platformExamples[helpPlatform].note}</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-2">Common Mistakes to Avoid</h4>
                  <ul className="text-yellow-800 text-sm space-y-1">
                    <li>• Don't use shortened URLs (like bit.ly)</li>
                    <li>• Make sure the URL is complete with https://</li>
                    <li>• Test the URL in your browser before adding</li>
                    <li>• Use the share button from the platform for correct format</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={closeHelpModal}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomMusicForm;
