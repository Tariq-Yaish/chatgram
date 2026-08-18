export const upload = async (file) =>
{
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "chatgram_images");

    try
    {
        const response = await fetch(
            "https://api.cloudinary.com/v1_1/y7tryi0g/image/upload",
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok)
        {
            const error = new Error("Upload failed!");
            console.error("Cloudinary upload error:", error);
            return Promise.reject(error);
        }

        const data = await response.json();

        return data.secure_url;
    }
    catch (error)
    {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
};