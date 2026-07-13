interface ProfileCardProps {
  image: string;
  title: string;
  description: string;
}

function ProfileCard({
  image,
  title,
  description,
}: ProfileCardProps) {
  return (
    <article className="profile-card">
      <div className="profile-image-wrapper">
        <img
          src={image}
          alt={title}
          className="profile-image"
        />
      </div>

      <h3>{title}</h3>

      <p>{description}</p>
    </article>
  );
}

export default ProfileCard;