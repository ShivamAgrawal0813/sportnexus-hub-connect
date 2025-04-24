import { Request, Response } from 'express';
import Tutorial, { ITutorial } from '../models/Tutorial';

// Helper function to format YouTube URLs
const formatYouTubeUrl = (url: string): string => {
  if (!url) return '';
  
  try {
    // Already an embed URL
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    // youtu.be format
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // youtube.com/watch format
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    // Return original if not a recognized YouTube URL
    return url;
  } catch (error) {
    console.error('Error formatting YouTube URL:', error);
    return url;
  }
};

// @desc    Get all tutorials with pagination and filters
// @route   GET /api/tutorials
// @access  Public
export const getTutorials = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filterObj: any = {};

    // Apply filters if provided
    if (req.query.sportType) {
      filterObj.sportType = req.query.sportType;
    }

    if (req.query.skillLevel) {
      filterObj.skillLevel = req.query.skillLevel;
    }

    if (req.query.author) {
      filterObj.author = req.query.author;
    }

    if (req.query.tag) {
      filterObj.tags = { $in: [req.query.tag] };
    }

    // Search functionality
    if (req.query.search) {
      filterObj.$text = { $search: req.query.search as string };
    }

    // Execute query
    const tutorials = await Tutorial.find(filterObj)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Tutorial.countDocuments(filterObj);

    res.json({
      tutorials,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error: any) {
    console.error('Get tutorials error:', error);
    res.status(500).json({
      message: 'Server error fetching tutorials',
      error: error.message,
    });
  }
};

// @desc    Get single tutorial by ID
// @route   GET /api/tutorials/:id
// @access  Public
export const getTutorialById = async (req: Request, res: Response) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id).populate(
      'author',
      'name'
    );

    if (tutorial) {
      // Increment views
      tutorial.views += 1;
      await tutorial.save();

      res.json(tutorial);
    } else {
      res.status(404).json({ message: 'Tutorial not found' });
    }
  } catch (error: any) {
    console.error('Get tutorial by ID error:', error);
    res.status(500).json({
      message: 'Server error fetching tutorial',
      error: error.message,
    });
  }
};

// @desc    Create a new tutorial
// @route   POST /api/tutorials
// @access  Private
export const createTutorial = async (req: Request, res: Response) => {
  try {
    const tutorialData = {
      ...req.body,
      author: req.user.id,
    };

    // Format YouTube URL if provided
    if (tutorialData.videoUrl) {
      tutorialData.videoUrl = formatYouTubeUrl(tutorialData.videoUrl);
    }

    // Format YouTube URLs in resources
    if (tutorialData.resources && Array.isArray(tutorialData.resources)) {
      tutorialData.resources = tutorialData.resources.map(resource => {
        if (resource.type === 'Video' && resource.url) {
          return {
            ...resource,
            url: formatYouTubeUrl(resource.url)
          };
        }
        return resource;
      });
    }

    const tutorial = await Tutorial.create(tutorialData);

    res.status(201).json(tutorial);
  } catch (error: any) {
    console.error('Create tutorial error:', error);
    res.status(500).json({
      message: 'Server error creating tutorial',
      error: error.message,
    });
  }
};

// @desc    Update a tutorial
// @route   PUT /api/tutorials/:id
// @access  Private
export const updateTutorial = async (req: Request, res: Response) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);

    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found' });
    }

    // Check if user is the author
    if (tutorial.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this tutorial' });
    }

    const updateData = { ...req.body };
    
    // Format YouTube URL if provided
    if (updateData.videoUrl) {
      updateData.videoUrl = formatYouTubeUrl(updateData.videoUrl);
    }

    // Format YouTube URLs in resources
    if (updateData.resources && Array.isArray(updateData.resources)) {
      updateData.resources = updateData.resources.map(resource => {
        if (resource.type === 'Video' && resource.url) {
          return {
            ...resource,
            url: formatYouTubeUrl(resource.url)
          };
        }
        return resource;
      });
    }

    // Update tutorial data
    const updatedTutorial = await Tutorial.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedTutorial);
  } catch (error: any) {
    console.error('Update tutorial error:', error);
    res.status(500).json({
      message: 'Server error updating tutorial',
      error: error.message,
    });
  }
};

// @desc    Delete a tutorial
// @route   DELETE /api/tutorials/:id
// @access  Private
export const deleteTutorial = async (req: Request, res: Response) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);

    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found' });
    }

    // Check if user is the author or an admin
    if (tutorial.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this tutorial' });
    }

    await tutorial.deleteOne();
    res.json({ message: 'Tutorial removed' });
  } catch (error: any) {
    console.error('Delete tutorial error:', error);
    res.status(500).json({
      message: 'Server error deleting tutorial',
      error: error.message,
    });
  }
};

// @desc    Like a tutorial
// @route   POST /api/tutorials/:id/like
// @access  Private
export const likeTutorial = async (req: Request, res: Response) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);

    if (!tutorial) {
      return res.status(404).json({ message: 'Tutorial not found' });
    }

    // Increment likes
    tutorial.likes += 1;
    await tutorial.save();

    res.json({ likes: tutorial.likes });
  } catch (error: any) {
    console.error('Like tutorial error:', error);
    res.status(500).json({
      message: 'Server error liking tutorial',
      error: error.message,
    });
  }
};

// @desc    Get user's enrolled tutorials
// @route   GET /api/tutorials/enrolled
// @access  Private
export const getEnrolledTutorials = async (req: Request, res: Response) => {
  try {
    // In a real application, we'd query an enrollments collection 
    // For now, we'll just return some recent tutorials as "enrolled"
    const tutorials = await Tutorial.find({})
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      tutorials,
      success: true
    });
  } catch (error: any) {
    console.error('Get enrolled tutorials error:', error);
    res.status(500).json({
      message: 'Server error fetching enrolled tutorials',
      error: error.message,
    });
  }
};

export default {
  getTutorials,
  getTutorialById,
  createTutorial,
  updateTutorial,
  deleteTutorial,
  likeTutorial,
  getEnrolledTutorials
}; 