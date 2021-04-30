import React, { useState, useEffect } from 'react';

function Substack() {
  const [shouldShowIframe, setShouldShowIframe] = useState(false);

  useEffect(() => {
    setShouldShowIframe(true);
  }, []);

  return (
    <div className="pt-10">
      <div className="text-center p-5 text-base">
        Pssst... Hey you! You can subscribe to my blog.
        <br />
        Don't worry, I don't post often.
      </div>
      {shouldShowIframe && (
        <iframe
          loading="lazy"
          id="substack"
          title="substack"
          src="https://axeldelafosse.substack.com/embed"
          width="100%"
          height="100"
          frameBorder="0"
          scrolling="no"
        />
      )}
    </div>
  );
}

export default Substack;