# Upload Image
![image](https://github.com/user-attachments/assets/638256ce-4591-451f-8076-e94e45e1b8cd)
- Run the Server
- Then select post to upload an image (Left side of url)
- Select Body
- Select form-data
- For the key it needs to be "image"
- Then in the same box it is defaulted to Text change it to File
- In value you can upload the image you want (if it does not allow you go to [Allow File Reading](#allow-file-reading))
- Then Click Send
- Once you uploaded you will receive a JSON of the image schema
![image](https://github.com/user-attachments/assets/ba01eb79-63c4-47f8-b312-056bebe2a865)

# View and Delete Image
![image](https://github.com/user-attachments/assets/c27d750a-d6ac-4dee-920d-e54e5af81901)
- To view or delete the image you will need the id value that is found in the JSON code
- Then will select the action you want Get (view) or Del (Delete) to do that action.
- The URL to find an image is "http://localhost:5000/images/id"
- Then Click Send

# Update Image
![image](https://github.com/user-attachments/assets/b481951c-351a-44d5-9d35-408ab78bf986)
- To update an image you will need the id value from the image you want updated
- You will select Put
- The URL will be "http://localhost:5000/images/id"
- Select Body
- Select form-data
- For the key it needs to be "image"
- Then in the same box it is defaulted to Text change it to File
- In value you can upload the image you want (if it does not allow you go to [Allow File Reading](#allow-file-reading))
- Then Click Send


# Allow File Reading
![image](https://github.com/user-attachments/assets/91d1e180-ed5a-4c20-99f3-5dece44ccf2a)
- Click on the gear icon on the top right side of Postman
- Click on Setting
- Then Choose the location of the Working Directory
- This directory is where all the files you want to be uploaded will be at
- You can also make it so that it can read all direcoties
