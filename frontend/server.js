const express = require("express");
const cors = require("cors");
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
// Fallback: try loading from parent directory if not found in CWD (useful for dist/ builds)
if (!process.env.SUPABASE_URL) {
  require('dotenv').config({ path: path.resolve(process.cwd(), '..', '.env') });
}
if (!process.env.SUPABASE_URL) {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
}
const { v4: uuidv4 } = require("uuid");
const { supabase } = require("./db");
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "supabase-backend-node" });
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (error || !data || data.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = data[0];

    // Bug: Using assignment (=) instead of comparison (===)
    // This condition will always be true (as long as password is not empty string)
    // And it modifies the user object in memory!
    // Fix: Use strict equality for password comparison
    if (user.password_hash === password) {
      return res.json(user);
    }

    return res.status(401).json({ error: "Invalid credentials" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    const newUser = {
      email,
      password_hash: password,
      name,
    };

    const { data, error } = await supabase
      .from("users")
      .insert(newUser)
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/courses", async (req, res) => {
  try {
    const { data, error } = await supabase.from("courses").select("*");
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/courses/:course_id", async (req, res) => {
  const { course_id } = req.params;
  console.log(`Fetching course with ID: ${course_id}`);
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("*, quizzes(*, questions:quiz_questions(*))")
      .eq("id", Number(course_id));

    if (error || !data || data.length === 0) {
      console.warn(`Course not found: ${course_id}`);
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(data[0]);
  } catch (e) {
    console.error(`Error fetching course ${course_id}:`, e);
    res.status(500).json({ error: e.message });
  }
});

// course completed or not
app.get("/enrollments/:course_id/:user_id", async (req, res) => {
  const { course_id, user_id } = req.params;

  try {
    const { data, error } = await supabase
      .from("enrollments")
      .select("*")
      .eq("course_id", Number(course_id))
      .eq("user_id", Number(user_id))
      .maybeSingle();

    if (error) {
      console.error("DB Error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    // Always return 200
    // Bug: Return {} instead of null. Frontend checks if (data), which checks if TRUTHY.
    // {} is truthy, so frontend tries to use it.
    // Return null if no data found so frontend can handle it correctly
    return res.status(200).json(data || null);

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/certificate/:course_id/:user_id", async (req, res) => {
  const { course_id, user_id } = req.params;

  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("course_id", Number(course_id))
      .eq("user_id", Number(user_id))
      .maybeSingle();

    if (error) {
      console.error("DB Error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    // Always return 200
    return res.status(200).json(data || null);

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/courses', async (req, res) => {
  const payload = req.body;
  const courseData = {
    title: payload.title,
    short_description: payload.short_description,
    description: payload.description,
    instructor: payload.instructor,
    duration: payload.duration,
    category: payload.category || 'Programming',
    level: payload.level || 'Beginner',
    thumbnail: payload.thumbnail,
    youtube_link_1: payload.youtube_link_1,
    youtube_link_2: payload.youtube_link_2,
  };

  try {
    const { data, error } = await supabase
      .from("courses")
      .insert(courseData)
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/courses/:course_id", async (req, res) => {
  const { course_id } = req.params;
  console.log(`Deleting course with ID: ${course_id}`);
  try {
    const { data, error } = await supabase
      .from("courses")
      .delete()
      .eq("id", Number(course_id))
      .select();

    if (error || !data || data.length === 0) {
      return res
        .status(404)
        .json({ error: "Course not found or already deleted" });
    }
    res.json({ message: "Course deleted" });
  } catch (e) {
    console.error(`Error deleting course ${course_id}:`, e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/courses/:course_id/complete", async (req, res) => {
  const { course_id } = req.params;
  const { user_id } = req.body;
  console.log(`Completing course ID: ${course_id} for user ID: ${user_id}`);

  try {
    const { data: lookup, error: lookupError } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", Number(user_id))
      .eq("course_id", Number(course_id));

    if (lookupError) throw lookupError;

    if (lookup && lookup.length > 0) {
      const enrollment_id = lookup[0].id;
      const { error: updateError } = await supabase
        .from("enrollments")
        .update({ progress: 50, completed: false })
        .eq("id", enrollment_id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from("enrollments").insert({
        user_id: Number(user_id),
        course_id: Number(course_id),
        progress: 50,
        completed: false,
      });
      if (insertError) throw insertError;
    }

    res.json({ status: "completed", can_take_quiz: true });
  } catch (e) {
    console.error(`Error completing course ${course_id}:`, e);
    res.status(500).json({ error: e.message });
  }
});

app.get("/courses/:course_id/applicants", async (req, res) => {
  const { course_id } = req.params;
  try {
    const { data, error } = await supabase
      .from("enrollments")
      .select("*, users(*)")
      .eq("course_id", course_id);

    if (error) throw error;

    const applicants = data
      .filter((item) => item.users)
      .map((item) => ({
        ...item.users,
        enrolledAt: item.enrolled_at,
        progress: item.progress,
      }));

    res.json(applicants);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.get("/users", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/users/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", Number(user_id));

    if (error || !data || data.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(data[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/users/:user_id/enroll", async (req, res) => {
  const { user_id } = req.params;
  const { course_id } = req.body;
  console.log(`Enrolling user ${user_id} in course ${course_id}`);

  if (!course_id) {
    return res.status(400).json({ error: "course_id required" });
  }

  try {
    const { data: existing } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", Number(user_id))
      .eq("course_id", Number(course_id));

    if (existing && existing.length > 0) {
      return res.json(existing[0]);
    }

    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        user_id: Number(user_id),
        course_id: Number(course_id),
        progress: 0,
      })
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (e) {
    console.error(`Error enrolling user ${user_id}:`, e);
    res.status(500).json({ error: e.message });
  }
});

app.get("/users/:user_id/courses", async (req, res) => {
  const { user_id } = req.params;
  try {
    const { data, error } = await supabase
      .from("enrollments")
      .select("*, courses(*)")
      .eq("user_id", user_id);

    if (error) throw error;

    const coursesData = data
      .filter((item) => item.courses)
      .map((item) => ({
        ...item.courses,
        progress: item.progress,
        completed: item.completed,
        enrolledAt: item.enrolled_at,
      }));

    res.json(coursesData);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.get("/quizzes", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*, questions:quiz_questions(*)");
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/quizzes", async (req, res) => {
  const { course_id, title, questions } = req.body;
  try {
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .insert({ course_id, title })
      .select();

    if (quizError) throw quizError;

    const quiz = quizData[0];
    const quiz_id = quiz.id;

    if (questions && questions.length > 0) {
      const questionsToInsert = questions.map((q) => ({
        quiz_id,
        question: q.question,
        options: q.options,
        correct: q.correct,
      }));

      const { error: questionsError } = await supabase
        .from("quiz_questions")
        .insert(questionsToInsert);
      if (questionsError) throw questionsError;
    }

    res.status(201).json(quiz);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/certificates", async (req, res) => {
  const { user_id } = req.query;
  try {
    let query = supabase.from("certificates").select("*");
    if (user_id) {
      query = query.eq("user_id", user_id);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/quiz/submission", async (req, res) => {
  const { user_id, course_id, score_percent, course_name } = req.body;
  console.log(
    `Quiz submission for user ${user_id}, course ${course_id}, score ${score_percent}%`,
  );

  if (score_percent !== undefined && score_percent >= 60) {
    try {
      const cert_code = uuidv4().split("-")[0].toUpperCase();

      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("id", Number(course_id))
        .single();

      const certificate = {
        user_id: Number(user_id),
        course_id: Number(course_id),
        certificate_number: `CERT-${cert_code}`,
        grade: `${score_percent}%`,
        course_name: courseData ? courseData.title : course_name,
        instructor: courseData ? courseData.instructor : null,
        completion_date: new Date().toISOString().split("T")[0],
      };

      const { data, error } = await supabase
        .from("certificates")
        .insert(certificate)
        .select();

      if (error) throw error;

      // Update enrollment to 100% complete
      await supabase
        .from("enrollments")
        .update({ progress: 100, completed: true })
        .eq("user_id", Number(user_id))
        .eq("course_id", Number(course_id));

      console.log(`Certificate generated: ${data[0].certificate_number}`);
      res.json({ passed: true, certificate: data[0] });
    } catch (e) {
      console.error(`Error processing quiz submission:`, e);
      res.status(500).json({ error: e.message });
    }
  } else {
    res.json({ passed: false, message: "Score too low. Try again." });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;