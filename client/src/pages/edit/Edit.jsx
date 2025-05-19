import React, { useReducer, useState, useEffect } from "react";
import "../add/Add.scss";
import "./Edit.scss";
import { gigReducer } from "../../reducers/gigReducer";
import upload from "../../utils/upload";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import newRequest from "../../utils/newRequest";
import { useNavigate, useParams } from "react-router-dom";
import { TagsInput } from "../../components/tagsInput/TagsInput";

const Edit = () => {
  const { id } = useParams();
  const [singleFile, setSingleFile] = useState(undefined);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState([]);
  const [state, dispatch] = useReducer(gigReducer, {});
  const [isLoading, setIsLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => newRequest.get("/categories").then((res) => res.data),
  });

  // Fetch the gig data
  const { data: gigData, isError } = useQuery({
    queryKey: ["gig", id],
    queryFn: () => newRequest.get(`/gigs/${id}`).then((res) => res.data),
    enabled: !!id,
  });

  // Initialize state with gig data
  useEffect(() => {
    if (gigData && categories) {
      setIsLoading(false);

      // Find category by ID and get its slug
      const categorySlug =
        categories.find((cat) => cat._id === gigData.categoryId?._id)?.slug ||
        "";

      // Set tags array
      setTags(gigData.tags || []);

      // Map API data to form state
      dispatch({
        type: "INITIALIZE_GIG",
        payload: {
          title: gigData.title,
          cat: categorySlug,
          cover: gigData.cover,
          images: gigData.images || [],
          desc: gigData.desc,
          shortTitle: gigData.shortTitle,
          shortDesc: gigData.shortDesc,
          deliveryTime: gigData.deliveryTime,
          revisionNumber: gigData.revisionNumber,
          features: gigData.features || [],
          tags: gigData.tags || [],
          price: gigData.price,
        },
      });
    }
  }, [gigData, categories]);

  useEffect(() => {
    // Update tags in state when tags change
    dispatch({
      type: "CHANGE_INPUT",
      payload: { name: "tags", value: tags },
    });
  }, [tags]);

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
    setUploading(true);
    try {
      let coverUrl = state.cover;
      let imageUrls = state.images || [];

      if (singleFile) {
        coverUrl = await upload(singleFile);
      }

      if (files.length > 0) {
        const newImages = await Promise.all(
          [...files].map(async (file) => {
            const url = await upload(file);
            return url;
          })
        );
        imageUrls = [...newImages];
      }

      setUploading(false);
      dispatch({
        type: "ADD_IMAGES",
        payload: { cover: coverUrl, images: imageUrls },
      });
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

  const updateMutation = useMutation({
    mutationFn: (gigData) => {
      return newRequest.put(`/gigs/${id}`, gigData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["myGigs"]);
      queryClient.invalidateQueries(["gig", id]);
      navigate("/mygigs");
    },
    onError: (error) => {
      console.error("Error updating gig:", error);
      setFormErrors({
        ...formErrors,
        submit: error.response?.data || "Error updating gig",
      });
    },
  });

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

      updateMutation.mutate(gigData);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (isLoading || loadingCategories)
    return <div className="loading">Loading gig data...</div>;
  if (isError) return <div className="error">Error loading gig data</div>;

  return (
    <div className="add">
      <div className="container">
        <h1>Edit Gig</h1>

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
              value={state.title || ""}
              placeholder="e.g. I will design a professional website for your business"
              onChange={handleChange}
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
              value={state.cat || ""}
              onChange={handleChange}
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

            <div className="images">
              <div className="imagesInputs">
                <label htmlFor="cover">
                  Cover Image <span className="required">*</span>
                </label>
                {state.cover && (
                  <div className="current-image">
                    <img src={state.cover} alt="Current cover" />
                    <span>Current cover image</span>
                  </div>
                )}
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
                {state.images && state.images.length > 0 && (
                  <div className="current-images">
                    <span>Current images:</span>
                    <div className="image-gallery">
                      {state.images.map((img, index) => (
                        <img key={index} src={img} alt={`Gig image ${index}`} />
                      ))}
                    </div>
                  </div>
                )}
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

            <label htmlFor="desc">
              Description <span className="required">*</span>
            </label>
            <textarea
              name="desc"
              id="desc"
              value={state.desc || ""}
              placeholder="Describe your service in detail including what the buyers will receive..."
              cols="0"
              rows="16"
              onChange={handleChange}
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
              disabled={updateMutation.isLoading || uploading}
            >
              {updateMutation.isLoading ? "Updating..." : "Update Gig"}
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
              value={state.shortTitle || ""}
              placeholder="e.g. Professional website design"
              onChange={handleChange}
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
              value={state.shortDesc || ""}
              onChange={handleChange}
              id="shortDesc"
              placeholder="Brief summary of your service (appears in search results)"
              cols="30"
              rows="10"
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
              value={state.deliveryTime || ""}
              onChange={handleChange}
              min="1"
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
              value={state.revisionNumber || ""}
              onChange={handleChange}
              min="0"
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
              value={state.price || ""}
              onChange={handleChange}
              min="1"
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

export default Edit;
