import React, { useState } from 'react';
import RestaurantInfo from '../components/RestaurantInfo.jsx';
import RestaurantSearchResult from '../components/RestaurantSearchResult.jsx';
import RatingsTable from '../components/RatingsTable.jsx';
import '../stylesheets/new-restaurant.css';
import '../stylesheets/details-modal.css';
import RatingNotes from '../components/RatingNotes.jsx';
import helperFns from '../helperFns.js';
import { useNavigate } from 'react-router-dom';
import RatingStars from '../components/RatingStars.jsx';
import '../stylesheets/ratings-table.css';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as hollowStar } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../stylesheets/rating-stars.css';


const NewRestaurant = props => {

  // lines 21 - 65 are from RatingsTable
  const [numFilledStars, setNumFilledStars] = useState(0);
  const [textNotes, setTextNotes] = useState('')

  const onStarClick = (starId) => {
    /*
    NOTE: It seems like the "hit" box of the star doesn't line up with the star
    Seems like it's to the left of the starl... not sure why??
    */
    if (starId.length) {
      const starNum = Number(starId.split('star')[1]);
      setNumFilledStars(starNum);
    } else {
      console.log('empty id');
    }
  };
  
  const stars = [];
  let filledStarsCount = 0;
  for (let i = 1; i < 11; i++) {
    let star;
    if (filledStarsCount < numFilledStars) {
      star =
        <span id={`star${i}`}
          onClickCapture={(event) => onStarClick(event.target.id)}
          className="rating-star"
          key={i}>
          <FontAwesomeIcon
            icon={faStar}
            id={`star${i}`} />
        </span>;
      filledStarsCount++;
    } 
    else {
      star =
        <span id={`star${i}`}
          onClickCapture={(event) => onStarClick(event.target.id)}
          className="rating-star"
          key={i}>
          <FontAwesomeIcon
            icon={hollowStar}
            className="rating-star"
            id={`star${i}`} />
        </span>;
    }
    stars.push(star);
  }
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [searchResults, setSearchResults] = useState({});
  const [showReview, setShowReview] = useState(false);

  const navigate = useNavigate();

  const submitRestaurantName = async (event) => {
    try {
      event.preventDefault();
      console.log(event.currentTarget);
      const nameInput = document.querySelector('#restaurant-name-input');
      const restaurantName = nameInput.value;
      if (!restaurantName.length) {
        // This could be handled better... but no time :(
        alert('Please enter a restaurant name');
        return;
      }

      const locationInput = document.querySelector('#restaurant-location-input');
      const locationVal = locationInput.value;

      let requestUrl = `/api/search?query=${restaurantName}`;

      // - Modify the URL based on what the user input for the location
      // - If they selected Current Location, try using the user's geolocation coordinates
      // - Otherwise for a non-empty string value, append it to the query param
      // - For an empty string, Google Places API will default to user's location (based on IP address of req?)
      if (locationVal === 'Current Location') {
        const userCoords = helperFns.retrieveUserCoords();
        const latitude = Object.hasOwn(userCoords, 'latitude') ? userCoords.latitude : null;
        const longitude = Object.hasOwn(userCoords, 'longitude') ? userCoords.longitude : null;

        if (latitude && longitude) {
          requestUrl += `&latitude=${latitude}&longitude=${longitude}`;
        }
      } 
      else if (locationVal.length) {
        requestUrl += ` near ${locationVal}`;
      }
      // TODO - not handling scenario where no search results come back..
      console.log('submitRestaurantName, searching for restaurant name:', restaurantName,
        'location val: ', locationVal);

      console.log('NewRestaurant sending request to ', requestUrl);
      const response = await fetch(requestUrl);
      const jsonSearchResults = await response.json();

      const newSearchResults = {};
      for (const [googlePlaceId, googlePlaceInfo] of Object.entries(jsonSearchResults.results)) {
        newSearchResults[googlePlaceId] = {
          'name': googlePlaceInfo.name,
          'address': googlePlaceInfo.address
        };
      }

      setSearchResults(newSearchResults);
    } 
    catch (error) {
      // This should be better error handling..
      console.log('NewRestaurant submitRestaurantName error', error.message);
    }
  };

  const onSearchResultClick = async (event, selectedRestaurant) => {
    console.log(selectedRestaurant);
    try {
      const googlePlaceId = selectedRestaurant.googlePlaceId;
      const requestUrl = `/api/place-details?placeID=${googlePlaceId}`;

      const response = await fetch(requestUrl);
      const restaurantDetails = await response.json();

      // Note: Google Places API doesn't provide all of the details, so hardcoding for now
      // Yelp API should provide remaining details
      const newRestaurantInfo = await {};
      newRestaurantInfo['googlePlaceId'] = restaurantDetails.id;
      newRestaurantInfo['name'] = restaurantDetails.name;
      newRestaurantInfo['address'] = restaurantDetails.address;
      newRestaurantInfo['category'] = 'American (Traditional), Pizza, Pasta Shops';
      newRestaurantInfo['parking'] = 'Private lot parking';
      newRestaurantInfo['hours'] = restaurantDetails.hours;
      newRestaurantInfo['menu'] = 'https://www.google.com';
      newRestaurantInfo['dress-code'] = 'Casual';
      newRestaurantInfo['reservations'] = restaurantDetails.reservable;
      newRestaurantInfo['delivery'] = restaurantDetails.takeout;
      newRestaurantInfo['credit-cards'] = true;

      setSearchResults({});
      setRestaurantInfo(newRestaurantInfo);
    } 
    catch (error) {
      // This should be better error handling..
      console.log('NewRestaurant onSearchResultClick error', error.message);
    }
  };

  const onFinishBtnClick = async () => {
    // console.log('Finish button clicked');
    // TO DO - post request to /restaurant
    //app.post('/addToWishlist' post request with newRestaurantInfo as body
    const restaurant = restaurantInfo;
    restaurant.overall_score = numFilledStars;
    restaurant.notes = textNotes;
    const response = await fetch('/api/addToReviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(restaurant)
    });
  };

  const addToWishlist = async () => {
    const restaurant = restaurantInfo;
    restaurant.overall_score = numFilledStars;
    restaurant.notes = textNotes;
    const response = await fetch('/api/addToWishlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(restaurant)
    });
  };

  const addToFavorites = async () => {
    const restaurant = restaurantInfo;
    restaurant.overall_score = numFilledStars;
    restaurant.notes = textNotes;
    const response = await fetch('/api/addToFavorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(restaurant)
    });
  };

  const onReturnSearchBtnClick = () => {
    setSearchResults({});
  };

  const onReturnHomeBtnClick = () => {
    navigate('/home');
  };

  const searchResultItems = [];
  for (const [googlePlaceId, googlePlaceInfo] of Object.entries(searchResults)) {
    searchResultItems.push(
      <RestaurantSearchResult
        name={googlePlaceInfo.name}
        address={googlePlaceInfo.address}
        googlePlaceId={googlePlaceId}
        onSearchResultClick={onSearchResultClick}
        key={googlePlaceId}
      />
    );
  }

  if (searchResultItems.length > 0) {
    // VIEW SEARCH RESULTS
    return (
      <div id='new-restaurant-info'>
        <div id='new-restaurant-header'>Search Results</div>
        <button
          className='new-restaurant-button'
          onClick={onReturnSearchBtnClick}>
          Return to Search
        </button>
        {searchResultItems}
        {/* Skipping next button functionality for now..
        <button id='next-button'>Next</button> */}
      </div>
    );
  } 
  else if (restaurantInfo === null) {
    // SEARCH FOR A RESTAURANT
    return (
      <div id='new-restaurant-info'>
        <div id='new-restaurant-header'>Add a Restaurant</div>
        <div className='new-restaurant-prompt'>What is the name of the restaurant?</div>
        <form
          onSubmit={(event) => submitRestaurantName(event)}
          autoComplete='off'>
          <input
            id='restaurant-name-input'
            name='restaurant-name-input'
            className='new-restaurant-input'
            type='text' /><br />
          <label className='new-restaurant-prompt'
            htmlFor='restaurant-location-input'>
            Add a location to search in?
          </label><br />
          <input
            id='restaurant-location-input'
            name='restaurant-location-input'
            className='new-restaurant-input'
            type='text'
            list='location-options' />
          <datalist id='location-options'>
            <option value='Current Location' />
          </datalist>
          <br />
          <button id='return-home-btn'
            type='button'
            className='new-restaurant-button'
            onClick={onReturnHomeBtnClick}>Return Home</button>
          <input type='submit'
            value='Next'
            className='new-restaurant-button'></input>
        </form>
      </div>
    );
  } 
  else {
    // VIEW RESTAURANT DETAILS
    return (
      <div id='new-restaurant-info'>
        <div id="restaurant-name">{restaurantInfo.name}</div>
        <RestaurantInfo info={restaurantInfo} />
        <button onClick = {addToWishlist}>Add to Wishlist</button>
        <button onClick = {addToFavorites}>Add to Favorites</button>
        <button onClick = {() => setShowReview(!showReview)}>Add Review</button>
        {showReview &&
        <>
          <div className="section-header">
            <span>Ratings</span>
          </div> 
          {/* lines 281-296 are the RatingsTable component */}
          <table id="ratings-table">
            <tbody>
              {/* ROW 1 */}
              <tr>
                <td className="rating-label">
                  Yumz:
                </td>
                <td className="stars">
                  <span id="rating-stars">
                    {stars}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="section-header">
            <span>Notes</span>
          </div>
          <>
            <textarea id="rating-notes"
            type="text"
            onChange = {((e) => setTextNotes(e.target.value))}
            value = {textNotes}
            />
            <button className="details-modal-button"
              onClick={onFinishBtnClick}>
              Finish
            </button>
          </>
        </>
        }
      </div>
    );
  }
};

export default NewRestaurant;