import React, { useReducer, useState, useEffect } from "react";
import "./Add.scss";
import { gigReducer, INITIAL_STATE } from "../../reducers/gigReducer";
import upload from "../../utils/upload";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import newRequest from "../../utils/newRequest";
import { useNavigate } from "react-router-dom";
import { TagsInput } from "../../components/tagsInput/TagsInput";

const Add = () => {
  const [singleFile, setSingleFile] = useState(undefined);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState([]);
  const [state, dispatch] = useReducer(gigReducer, INITIAL_STATE);
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => newRequest.get("/categories").then((res) => res.data),
  });

  const handleChange = (e) => {
    dispatch({
      type: "CHANGE_INPUT",
      payload: { name: e.target.name, value: e.target.value },
    });
    // Clear error when field is edited
    if (formErrors[e.target.name]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: null,
      });
    }
  };

  const handleFeature = (e) => {
    e.preventDefault();
    const feature = e.target[0].value.trim();
    if (feature) {
      dispatch({
        type: "ADD_FEATURE",
        payload: feature,
      });
      e.target[0].value = "";
    }
  };

  const handleUpload = async () => {
    if (!singleFile) {
      setFormErrors({
        ...formErrors,
        cover: "Cover image is required",
      });
      return;
    }

    setUploading(true);
    try {
      const cover = await upload(singleFile);

      const images = await Promise.all(
        [...files].map(async (file) => {
          const url = await upload(file);
          return url;
        })
      );
      setUploading(false);
      dispatch({ type: "ADD_IMAGES", payload: { cover, images } });
      setFormErrors({
        ...formErrors,
        cover: null,
      });
    } catch (err) {
      console.log(err);
      setUploading(false);
      setFormErrors({
        ...formErrors,
        upload: "Error uploading files. Please try again.",
      });
    }
  };

  useEffect(() => {
    // Set tags from state when component loads
    if (state.tags) {
      setTags(state.tags);
    }
  }, []);

  useEffect(() => {
    // Update tags in state when tags change
    dispatch({
      type: "CHANGE_INPUT",
      payload: { name: "tags", value: tags },
    });
  }, [tags]);

  const mutation = useMutation({
    mutationFn: (gig) => {
      return newRequest.post("/gigs", gig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["myGigs"]);
      navigate("/mygigs");
    },
    onError: (error) => {
      console.error("Error creating gig:", error);
      setFormErrors({
        ...formErrors,
        submit: error.response?.data || "Error creating gig",
      });
    },
  });

  const validateForm = () => {
    const errors = {};
    const requiredFields = [
      "title",
      "desc",
      "cat",
      "shortTitle",
      "shortDesc",
      "deliveryTime",
      "revisionNumber",
      "price",
    ];
    const fieldNames = {
      title: "Title",
      desc: "Description",
      cat: "Category",
      shortTitle: "Service Title",
      shortDesc: "Short Description",
      deliveryTime: "Delivery Time",
      revisionNumber: "Revision Number",
      price: "Price",
    };

    requiredFields.forEach((field) => {
      if (!state[field]) {
        errors[field] = `${fieldNames[field]} is required`;
      }
    });

    if (!state.cover) {
      errors.cover = "Cover image is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Map cat (slug) to categoryId before submission
      const categoryObj = categories?.find((cat) => cat.slug === state.cat);
      if (!categoryObj) {
        setFormErrors({ ...formErrors, cat: "Please select a valid category" });
        return;
      }

      const gigData = {
        ...state,
        categoryId: categoryObj._id,
      };

      mutation.mutate(gigData);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="add">
      <div className="container">
        <h1>Add New Gig</h1>

        {formErrors.submit && (
          <div className="error-message global-error">{formErrors.submit}</div>
        )}

        <div className="sections">
          <div className="info">
            <label htmlFor="title">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              name="title"
              id="title"
              placeholder="e.g. I will design a professional website for your business"
              onChange={handleChange}
              value={state.title}
              className={formErrors.title ? "error" : ""}
            />
            {formErrors.title && (
              <p className="error-message">{formErrors.title}</p>
            )}

            <label htmlFor="cat">
              Category <span className="required">*</span>
            </label>
            <select
              name="cat"
              id="cat"
              onChange={handleChange}
              value={state.cat}
              className={formErrors.cat ? "error" : ""}
              disabled={loadingCategories}
            >
              <option value="">Select a category</option>
              {categories?.map((category) => (
                <option key={category._id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            {formErrors.cat && (
              <p className="error-message">{formErrors.cat}</p>
            )}
            {loadingCategories && (
              <p className="loading-text">Loading categories...</p>
            )}

            <div className="images">
              <div className="imagesInputs">
                <label htmlFor="cover">
                  Cover Image <span className="required">*</span>
                </label>
                <input
                  type="file"
                  id="cover"
                  onChange={(e) => setSingleFile(e.target.files[0])}
                  className={formErrors.cover ? "error" : ""}
                />
                {formErrors.cover && (
                  <p className="error-message">{formErrors.cover}</p>
                )}

                <label htmlFor="images">Additional Images</label>
                <input
                  type="file"
                  id="images"
                  multiple
                  onChange={(e) => setFiles(e.target.files)}
                />
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={uploading ? "uploading" : ""}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>

            {state.cover && (
              <div className="uploaded-images">
                <h3>Cover Image:</h3>
                <img src={state.cover} alt="Cover" className="cover-preview" />
                {state.images && state.images.length > 0 && (
                  <>
                    <h3>Additional Images:</h3>
                    <div className="gallery">
                      {state.images.map((img, index) => (
                        <img key={index} src={img} alt={`Gig image ${index}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <label htmlFor="desc">
              Description <span className="required">*</span>
            </label>
            <textarea
              name="desc"
              id="desc"
              placeholder="Describe your service in detail including what the buyers will receive..."
              cols="0"
              rows="16"
              onChange={handleChange}
              value={state.desc || ""}
              className={formErrors.desc ? "error" : ""}
            ></textarea>
            {formErrors.desc && (
              <p className="error-message">{formErrors.desc}</p>
            )}

            <label htmlFor="tags">Tags (press enter to add)</label>
            <TagsInput
              value={tags}
              onChange={setTags}
              name="tags"
              placeHolder="Add relevant keywords to help buyers find your gig"
            />
            <small>Add up to 5 tags to help buyers find your gig</small>

            <button
              onClick={handleSubmit}
              className="submit-btn"
              disabled={mutation.isLoading || uploading}
            >
              {mutation.isLoading ? "Creating..." : "Create Gig"}
            </button>
          </div>
          <div className="details">
            <label htmlFor="shortTitle">
              Service Title <span className="required">*</span>
            </label>
            <input
              type="text"
              name="shortTitle"
              id="shortTitle"
              placeholder="e.g. Professional website design"
              onChange={handleChange}
              value={state.shortTitle || ""}
              className={formErrors.shortTitle ? "error" : ""}
            />
            {formErrors.shortTitle && (
              <p className="error-message">{formErrors.shortTitle}</p>
            )}

            <label htmlFor="shortDesc">
              Short Description <span className="required">*</span>
            </label>
            <textarea
              name="shortDesc"
              id="shortDesc"
              onChange={handleChange}
              placeholder="Brief summary of your service (appears in search results)"
              cols="30"
              rows="10"
              value={state.shortDesc || ""}
              className={formErrors.shortDesc ? "error" : ""}
            ></textarea>
            {formErrors.shortDesc && (
              <p className="error-message">{formErrors.shortDesc}</p>
            )}

            <label htmlFor="deliveryTime">
              Delivery Time (days) <span className="required">*</span>
            </label>
            <input
              type="number"
              name="deliveryTime"
              id="deliveryTime"
              onChange={handleChange}
              min="1"
              value={state.deliveryTime || ""}
              className={formErrors.deliveryTime ? "error" : ""}
            />
            {formErrors.deliveryTime && (
              <p className="error-message">{formErrors.deliveryTime}</p>
            )}

            <label htmlFor="revisionNumber">
              Revision Number <span className="required">*</span>
            </label>
            <input
              type="number"
              name="revisionNumber"
              id="revisionNumber"
              onChange={handleChange}
              min="0"
              value={state.revisionNumber || ""}
              className={formErrors.revisionNumber ? "error" : ""}
            />
            {formErrors.revisionNumber && (
              <p className="error-message">{formErrors.revisionNumber}</p>
            )}

            <label htmlFor="features">Add Features</label>
            <form action="" className="add" onSubmit={handleFeature}>
              <input type="text" placeholder="e.g. Responsive design" />
              <button type="submit">Add</button>
            </form>

            <div className="addedFeatures">
              {state.features?.map((f) => (
                <div className="item" key={f}>
                  <button
                    onClick={() =>
                      dispatch({ type: "REMOVE_FEATURE", payload: f })
                    }
                  >
                    {f}
                    <span>X</span>
                  </button>
                </div>
              ))}
            </div>

            <label htmlFor="price">
              Price ($) <span className="required">*</span>
            </label>
            <input
              type="number"
              name="price"
              id="price"
              onChange={handleChange}
              min="1"
              value={state.price || ""}
              className={formErrors.price ? "error" : ""}
            />
            {formErrors.price && (
              <p className="error-message">{formErrors.price}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Add;
