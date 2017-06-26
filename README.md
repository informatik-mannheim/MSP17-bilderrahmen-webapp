# MSP17-bilderrahmen-webapp

This repository is part of the ['Ich-Zeig-Dir-Was'-Bilderrahmen project](https://github.com/informatik-mannheim/bilderrahmen-msp17). The web application is used to upload pictures to and delete pictures from the bilderrahmen folder in google drive.
The web application is client side only and doesn't persist any user data.


## Prerequisites

```
Web server of your choice
Project in Google API Console
	API-Key for the web application
	OAuth-2.0-Client-ID for the web application
	Activated Google Drive API in API Manager
```

## Installing
Clone this repository or download it as ZIP.

```
https://github.com/informatik-mannheim/MSP17-bilderrahmen-webapp/archive/master.zip

or

git clone https://github.com/informatik-mannheim/MSP17-bilderrahmen-webapp.git
```

```
Copy the files into the appropriate folder of your web server and start it.
```

```
Visit your Project in the Google API Console and click on the OAuth-2.0-Client-ID of your web application.
Enter the URL of your web server under 'Authorized JavaScript origins' and 'Authorized redirect URIs' and save them.
```

## License
This project is licensed under the Apache-2.0 License - see the [LICENSE.md](LICENSE.md) file for details.
