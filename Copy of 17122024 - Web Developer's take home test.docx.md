**Windows Explorer**

**Description**

Create a Windows Explorer-like web page. The page is split horizontally into two panels. The left panel contains the folder structure, and the right panel contains the direct sub folders for the selected folder on the left panel.

Upon load, the frontend requests the data from the backend and displays the complete folder structure (all folders) on the left panel with nothing on the right panel. Folder can have unlimited \[subfolders. The subfolders can have unlimited levels. Upon clicking one of the folders on the left panel, the right panel displays the list of direct sub folders of the clicked folder.

**Technical Specification**

**Database**  
\- Contains the folder and file data.  
\- Must be either MySQL, MariaDB, or PostgreSQL.

**Backend**  
\- Serves an API for the Frontend.  
\- Loads data from the Database upon API request.  
\- Must use Typescript.  
\- Can use vanilla or any framework, but we prefer Elysia.  
\- Can use NodeJS or Bun, but we prefer Bun.

**Frontend**  
\- Consumes the backend API to display the page.  
\- Must use Vue 3 with composition API.  
\- Can use any libraries, EXCEPT the library to display folder structures or similar.  
\- You must build the folder structure display from scratch.  
\- Can use NodeJS, or Bun, but we prefer Bun.

**What we will assess**

\- How clean and clear your code is.  
\- The data structure you choose.  
\- The algorithm.  
\- Best practices you implement.

**Bonus points (optional)**

\- Displaying files in the right panel.  
\- Making the folders in the left panel openable and closable (like windows explorer, or file explorer in your IDE).  
\- Making your application scalable (for example, you have millions of data and thousands of concurrent users).  
\- Implementing search function.  
\- Using UI components.  
\- Using hexagonal or clean architecture.  
\- Using service and repository layer.  
\- Using SOLID principles.  
\- Using unit tests.  
\- Using unit tests for UI componennts.  
\- Using integration tests.  
\- Using E2E tests.  
\- Using REST API standards (versioning, method, naming).  
\- Using Bun runtime instead of NodeJS.  
\- Using Elysia.  
\- Using monorepo.  
\- Using ORM.

                                                          
Please contact our recruiter for further questions.                                                        