const StudentCard = ({ profile, spi }) => {
  if (!profile) return null;

  return (
    <section className="card">
      <h3 style={{ marginTop: 0 }}>Student Profile</h3>
      <p>
        <strong>Name:</strong> {profile.name}
      </p>
      <p>
        <strong>UID:</strong> {profile.uid}
      </p>
      <p>
        <strong>Class:</strong> {profile.class}
        {profile.section}
      </p>
      {spi ? (
        <>
          <p>
            <strong>SPI:</strong> {spi.spi}
          </p>
          <p>
            <strong>Category:</strong> {spi.category}
          </p>
        </>
      ) : null}
    </section>
  );
};

export default StudentCard;
