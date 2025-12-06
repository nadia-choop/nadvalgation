import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Star } from 'lucide-react';

interface LocationCardProps {
  id: string;
  name: string;
  address: string;
  visited: boolean;
  rating: number | null;
  comment: string | null;
  onUpdate: (id: string, updates: Partial<LocationData>) => void;
  onDelete: (id: string) => void;
}

interface LocationData {
  visited: boolean;
  rating: number | null;
  comment: string | null;
}

export function LocationCard({
  id,
  name,
  address,
  visited,
  rating,
  comment,
  onUpdate,
  onDelete,
}: LocationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editComment, setEditComment] = useState(comment || '');
  const [currentRating, setCurrentRating] = useState(rating || 0);

  const handleVisitedToggle = () => {
    onUpdate(id, { visited: !visited });
  };

  const handleRatingChange = (newRating: number) => {
    setCurrentRating(newRating);
    onUpdate(id, { rating: newRating });
  };

  const handleCommentSave = () => {
    onUpdate(id, { comment: editComment });
    setIsEditing(false);
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription>{address}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">

        <div className="flex items-center space-x-2">
          <Checkbox
            id={`visited-${id}`}
            checked={visited}
            onCheckedChange={handleVisitedToggle}
          />
          <label
            htmlFor={`visited-${id}`}
            className={`text-sm font-medium cursor-pointer ${
              visited ? 'text-green-600' : 'text-muted-foreground'
            }`}
          >
            {visited ? 'Visited ✓' : 'Not visited yet'}
          </label>
        </div>

        {/* Rating Stars */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingChange(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-5 w-5 ${
                    star <= currentRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Notes</p>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                {comment ? 'Edit' : 'Add'}
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder="Add your thoughts..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCommentSave}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditComment(comment || '');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {comment || 'No notes yet'}
            </p>
          )}
        </div>
        {visited && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Visited
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}