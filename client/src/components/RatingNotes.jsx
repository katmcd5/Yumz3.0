import React from 'react';
import '../stylesheets/rating-notes.css';

const RatingNotes = props => {
  return (
    <>
      <textarea id="rating-notes" type="text" />
      <button className="details-modal-button"
        onClick={props.clickHandler}>
        {props.buttonText}
      </button>
    </>
  );
};

export default RatingNotes;