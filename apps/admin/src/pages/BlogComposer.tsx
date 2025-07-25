import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Editor } from 'novel';
import { Button } from '@blackliving/ui/components/ui/button';
import { Input } from '@blackliving/ui/components/ui/input';
import { Label } from '@blackliving/ui/components/ui/label';
import { Textarea } from '@blackliving/ui/components/ui/textarea';
import { ArrowLeft, Save, Eye } from 'lucide-react';

export default function BlogComposer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  
  const [post, setPost] = useState({
    title: '',
    description: '',
    content: '',
    tags: '',
    featured: false,
    published: false
  });

  const handleSave = async () => {
    // Implement save logic with API call
    console.log('Saving post:', post);
  };

  const handlePublish = async () => {
    // Implement publish logic
    setPost(prev => ({ ...prev, published: true }));
    await handleSave();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/posts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            ‘ﬁá‡h
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Ë/á‡' : '∞Î∞á‡'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Ω
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            2XI?
          </Button>
          <Button onClick={handlePublish} className="bg-green-600 hover:bg-green-700">
            |á‡
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <Label htmlFor="title">á‡L</Label>
            <Input
              id="title"
              value={post.title}
              onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
              placeholder="8eá‡L..."
              className="text-lg"
            />
          </div>

          <div>
            <Label htmlFor="description">á‡XÅ</Label>
            <Textarea
              id="description"
              value={post.description}
              onChange={(e) => setPost(prev => ({ ...prev, description: e.target.value }))}
              placeholder="8eá‡XÅ..."
              rows={3}
            />
          </div>

          <div>
            <Label>á‡gπ</Label>
            <div className="border rounded-lg overflow-hidden">
              <Editor
                defaultValue={post.content}
                onUpdate={(editor) => {
                  setPost(prev => ({ ...prev, content: editor?.getHTML() || '' }));
                }}
                className="min-h-[500px]"
                editorProps={{
                  attributes: {
                    class: 'prose prose-lg max-w-none p-4 focus:outline-none',
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-4 border rounded-lg">
            <h3 className="font-semibold mb-4">|-ö</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="tags">d</Label>
                <Input
                  id="tags"
                  value={post.tags}
                  onChange={(e) => setPost(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="(_îd"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={post.featured}
                  onChange={(e) => setPost(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="featured">-∫æxá‡</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={post.published}
                  onChange={(e) => setPost(prev => ({ ...prev, published: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="published">Às|</Label>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 border rounded-lg">
            <h3 className="font-semibold mb-4">SEO -ö</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Lw¶: {post.title.length}/60</p>
              <p>XÅw¶: {post.description.length}/160</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}