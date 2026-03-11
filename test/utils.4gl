###############################################################################
# PROGRAMA: utils.4gl
# OBJETIVO: Funciones utilitarias para probar autocompletado cross-file
###############################################################################

FUNCTION format_date(p_date, p_format)
  DEFINE p_date   DATE
  DEFINE p_format CHAR(20)
  DEFINE l_result CHAR(20)

  LET l_result = p_date USING p_format

  RETURN l_result
END FUNCTION

FUNCTION validate_email(p_email)
  DEFINE p_email  CHAR(100)
  DEFINE l_valid  SMALLINT

  IF p_email IS NULL THEN
    LET l_valid = FALSE
    RETURN l_valid
  END IF

  IF LENGTH(p_email) < 5 THEN
    LET l_valid = FALSE
  ELSE
    LET l_valid = TRUE
  END IF

  RETURN l_valid
END FUNCTION

FUNCTION get_sequence(p_table, p_column)
  DEFINE p_table  CHAR(50)
  DEFINE p_column CHAR(50)
  DEFINE l_seq    INTEGER
  DEFINE l_sql    CHAR(200)

  LET l_sql = "SELECT MAX(", p_column CLIPPED, ") + 1 FROM ", p_table CLIPPED
  PREPARE s_seq FROM l_sql
  DECLARE c_seq CURSOR FOR s_seq
  OPEN c_seq
  FETCH c_seq INTO l_seq
  CLOSE c_seq
  FREE c_seq

  IF l_seq IS NULL THEN
    LET l_seq = 1
  END IF

  RETURN l_seq
END FUNCTION

FUNCTION show_message(p_msg, p_type)
  DEFINE p_msg  CHAR(200)
  DEFINE p_type CHAR(1)

  CASE p_type
    WHEN "E"
      ERROR p_msg CLIPPED
      SLEEP 3
    WHEN "M"
      MESSAGE p_msg CLIPPED
    WHEN "D"
      DISPLAY p_msg CLIPPED
      SLEEP 2
  END CASE
END FUNCTION

FUNCTION log_activity(p_user, p_action, p_detail)
  DEFINE p_user   CHAR(20)
  DEFINE p_action CHAR(10)
  DEFINE p_detail CHAR(200)

  WHENEVER ERROR CONTINUE
  INSERT INTO activity_log
  VALUES (0, p_user, p_action, p_detail, CURRENT, STATUS)
  WHENEVER ERROR STOP
END FUNCTION
