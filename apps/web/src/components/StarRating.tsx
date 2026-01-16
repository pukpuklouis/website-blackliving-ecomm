import { Star } from "lucide-react";

type StarRatingProps = {
  rating: number;
  reviewCount?: number;
  showReviews?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export const StarRating = ({
  rating,
  reviewCount,
  showReviews = true,
  size = "md",
  className = "",
}: StarRatingProps) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Render full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
          key={`full-${i}`}
        />
      );
    }

    // Render half star if needed
    if (hasHalfStar) {
      stars.push(
        <div className={`relative ${sizeClasses[size]}`} key="half">
          <Star className={`${sizeClasses[size]} absolute text-gray-300`} />
          <div className="w-1/2 overflow-hidden">
            <Star
              className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
            />
          </div>
        </div>
      );
    }

    // Render empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star
          className={`${sizeClasses[size]} text-gray-300`}
          key={`empty-${i}`}
        />
      );
    }

    return stars;
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">{renderStars()}</div>
      {showReviews ? (
        <span className={`ml-1 text-gray-600 ${textSizeClasses[size]}`}>
          ({reviewCount || 0} 則評論)
        </span>
      ) : null}
    </div>
  );
};
